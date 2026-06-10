const Incident = require('../models/Incident');
const createAuditLog = require('../utils/createAuditLog');

const ALLOWED_STATUSES = ['OPEN', 'IN_PROGRESS', 'CLOSED'];

function formatIncident(item) {
    return {
        id: item._id,
        title: item.title,
        description: item.description,
        location: item.location,
        status: item.status,
        responsible: item.responsible,
        date: item.date,
        mapPoint: item.mapPoint,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
    };
}

function cleanString(value) {
    return String(value || '').trim();
}

function validateRequiredIncidentFields(data) {
    if (!data.title || !data.description || !data.location || !data.responsible || !data.date) {
        return 'Заполнены не все обязательные поля';
    }

    if (data.title.length < 3 || data.title.length > 120) {
        return 'Название инцидента должно быть от 3 до 120 символов';
    }

    if (data.description.length < 3 || data.description.length > 1500) {
        return 'Описание должно быть от 3 до 1500 символов';
    }

    if (data.location.length > 120) {
        return 'Место инцидента слишком длинное';
    }

    if (data.responsible.length > 120) {
        return 'Ответственный указан слишком длинно';
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
        return 'Дата должна быть в формате YYYY-MM-DD';
    }

    if (!ALLOWED_STATUSES.includes(data.status)) {
        return 'Некорректный статус инцидента';
    }

    return null;
}

function sanitizeMapPoint(mapPoint) {
    if (!mapPoint || typeof mapPoint !== 'object') {
        return undefined;
    }

    const cleanMapPoint = {};

    if (mapPoint.floor !== undefined && mapPoint.floor !== null) {
        const floor = Number(mapPoint.floor);

        if (!Number.isFinite(floor) || floor < 1 || floor > 20) {
            throw new Error('Некорректный этаж');
        }

        cleanMapPoint.floor = floor;
    }

    if (mapPoint.x !== undefined && mapPoint.x !== null) {
        const x = Number(mapPoint.x);

        if (!Number.isFinite(x) || x < 0 || x > 100) {
            throw new Error('Некорректная координата X');
        }

        cleanMapPoint.x = x;
    }

    if (mapPoint.y !== undefined && mapPoint.y !== null) {
        const y = Number(mapPoint.y);

        if (!Number.isFinite(y) || y < 0 || y > 100) {
            throw new Error('Некорректная координата Y');
        }

        cleanMapPoint.y = y;
    }

    if (mapPoint.place !== undefined && mapPoint.place !== null) {
        cleanMapPoint.place = cleanString(mapPoint.place).slice(0, 120);
    }

    return cleanMapPoint;
}

async function getIncidents(req, res) {
    try {
        const incidents = await Incident.find().sort({ createdAt: -1 });
        res.status(200).json(incidents.map(formatIncident));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
}

async function getIncidentById(req, res) {
    try {
        const incident = await Incident.findById(req.params.id);

        if (!incident) {
            return res.status(404).json({ message: 'Инцидент не найден' });
        }

        res.status(200).json(formatIncident(incident));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
}

async function createIncident(req, res) {
    try {
        const incidentData = {
            title: cleanString(req.body.title),
            description: cleanString(req.body.description),
            location: cleanString(req.body.location),
            status: cleanString(req.body.status || 'OPEN'),
            responsible: cleanString(req.body.responsible),
            date: cleanString(req.body.date),
            mapPoint: sanitizeMapPoint(req.body.mapPoint)
        };

        const validationError = validateRequiredIncidentFields(incidentData);

        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }

        const newIncident = await Incident.create(incidentData);

        await createAuditLog({
            req,
            action: 'CREATE_INCIDENT',
            entityType: 'incident',
            entityId: newIncident._id,
            message: `Создан инцидент: ${newIncident.title}`
        });

        res.status(201).json({
            message: 'Инцидент успешно создан',
            incident: formatIncident(newIncident)
        });
    } catch (error) {
        console.error(error);

        res.status(400).json({
            message: error.message || 'Ошибка создания инцидента'
        });
    }
}

async function updateIncident(req, res) {
    try {
        const updateData = {};

        if (req.body.title !== undefined) {
            updateData.title = cleanString(req.body.title);
        }

        if (req.body.description !== undefined) {
            updateData.description = cleanString(req.body.description);
        }

        if (req.body.location !== undefined) {
            updateData.location = cleanString(req.body.location);
        }

        if (req.body.status !== undefined) {
            updateData.status = cleanString(req.body.status);

            if (!ALLOWED_STATUSES.includes(updateData.status)) {
                return res.status(400).json({
                    message: 'Некорректный статус инцидента'
                });
            }
        }

        if (req.body.responsible !== undefined) {
            updateData.responsible = cleanString(req.body.responsible);
        }

        if (req.body.date !== undefined) {
            updateData.date = cleanString(req.body.date);

            if (!/^\d{4}-\d{2}-\d{2}$/.test(updateData.date)) {
                return res.status(400).json({
                    message: 'Дата должна быть в формате YYYY-MM-DD'
                });
            }
        }

        if (req.body.mapPoint !== undefined) {
            updateData.mapPoint = sanitizeMapPoint(req.body.mapPoint);
        }

        const updatedIncident = await Incident.findByIdAndUpdate(
            req.params.id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedIncident) {
            return res.status(404).json({ message: 'Инцидент не найден' });
        }

        await createAuditLog({
            req,
            action: 'UPDATE_INCIDENT',
            entityType: 'incident',
            entityId: updatedIncident._id,
            message: `Обновлён инцидент: ${updatedIncident.title}`
        });

        res.status(200).json({
            message: 'Инцидент успешно обновлён',
            incident: formatIncident(updatedIncident)
        });
    } catch (error) {
        console.error(error);

        res.status(400).json({
            message: error.message || 'Ошибка обновления инцидента'
        });
    }
}

async function deleteIncident(req, res) {
    try {
        const deletedIncident = await Incident.findByIdAndDelete(req.params.id);

        if (!deletedIncident) {
            return res.status(404).json({ message: 'Инцидент не найден' });
        }

        await createAuditLog({
            req,
            action: 'DELETE_INCIDENT',
            entityType: 'incident',
            entityId: deletedIncident._id,
            message: `Удалён инцидент: ${deletedIncident.title}`
        });

        res.status(200).json({
            message: 'Инцидент успешно удалён'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
}

module.exports = {
    getIncidents,
    getIncidentById,
    createIncident,
    updateIncident,
    deleteIncident
};