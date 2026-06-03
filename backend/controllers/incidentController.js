const Incident = require('../models/Incident');
const createAuditLog = require('../utils/createAuditLog');

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
        const {
            title,
            description,
            location,
            status,
            responsible,
            date,
            mapPoint
        } = req.body;

        if (!title || !description || !location || !status || !responsible || !date) {
            return res.status(400).json({
                message: 'Заполнены не все обязательные поля'
            });
        }

        const newIncident = await Incident.create({
            title,
            description,
            location,
            status,
            responsible,
            date,
            mapPoint
        });

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
        res.status(500).json({ message: 'Ошибка сервера' });
    }
}

async function updateIncident(req, res) {
    try {
        const updatedIncident = await Incident.findByIdAndUpdate(
            req.params.id,
            req.body,
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
        res.status(500).json({ message: 'Ошибка сервера' });
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