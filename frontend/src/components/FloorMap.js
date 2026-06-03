import { useState } from 'react';
import '../styles/floorMap.css';

const floorZones = {
    1: [
        { name: 'Кабинет 103', x1: 9.17, y1: 6.08, x2: 21.42, y2: 12.62 },
        { name: 'Кабинет 1', x1: 8.92, y1: 14.26, x2: 21.33, y2: 31.67 },
        { name: 'Кабинет 2', x1: 29.67, y1: 7.13, x2: 43.75, y2: 23.72 },
        { name: 'Кабинет 104', x1: 30.5, y1: 25.36, x2: 43.75, y2: 31.78 },
        { name: 'Раздевалка', x1: 29.25, y1: 33.54, x2: 35.58, y2: 50.01 },
        { name: 'Туалет', x1: 8.83, y1: 41.72, x2: 21.67, y2: 47.56 },
        { name: 'Кабинет 105', x1: 37, y1: 40.78, x2: 49.25, y2: 49.31 },
        { name: 'Кабинет 106', x1: 50.42, y1: 41.13, x2: 62.58, y2: 48.73 },
        { name: 'Кабинет 108', x1: 74.67, y1: 40.78, x2: 84.25, y2: 48.96 },
        { name: 'Буфет', x1: 63.67, y1: 56.32, x2: 79.5, y2: 67.31 },
        { name: 'Кабинет 110', x1: 56.58, y1: 55.97, x2: 62.58, y2: 66.73 },
        { name: 'Кабинет 111', x1: 53.58, y1: 56.32, x2: 55.58, y2: 66.96 },
        { name: 'Кабинет 112', x1: 47.08, y1: 56.91, x2: 52.58, y2: 67.08 },
        { name: 'Женский туалет', x1: 43.83, y1: 56.32, x2: 46.25, y2: 66.96 },
        { name: 'Лифт', x1: 35.58, y1: 59.83, x2: 38.08, y2: 64.39 },
        { name: 'Лестница около лифта', x1: 35.92, y1: 66.26, x2: 42.67, y2: 70.46 },
        { name: 'Вход в корпус', x1: 22.17, y1: 74.55, x2: 28.83, y2: 85.42 },
        { name: 'Лестница около кабинета 1', x1: 23.92, y1: 21.85, x2: 27.58, y2: 28.28 },
        { name: 'Зона отдыха', x1: 29.67, y1: 72.1, x2: 35.58, y2: 79.35 }
    ],
    2: [
        { name: 'Кабинет 220', x1: 7.67, y1: 6.87, x2: 20.08, y2: 12.48 },
        { name: 'Кабинет 1', x1: 8.33, y1: 14.86, x2: 20.42, y2: 42.76 },
        { name: 'Кабинет 3', x1: 28.08, y1: 7.01, x2: 41.25, y2: 24.4 },
        { name: 'Учебный центр ИБ', x1: 28, y1: 26.36, x2: 41.25, y2: 37.02 },
        { name: 'Буфет', x1: 28.08, y1: 39.26, x2: 33.92, y2: 53.14 },
        { name: 'Кабинет 206,207', x1: 7.58, y1: 44.73, x2: 20.05, y2: 50.48 },
        { name: 'Лестница между кабинетами 1 и 3', x1: 22.92, y1: 22.43, x2: 26.33, y2: 29.58 },
        { name: 'Кабинет 205', x1: 13.75, y1: 52.3, x2: 20.17, y2: 57.91 },
        { name: 'Кабинет 204', x1: 8, y1: 60.43, x2: 20.08, y2: 67.72 },
        { name: 'Лестница между кабинетами 204 и 203а', x1: 7.42, y1: 69.26, x2: 13.42, y2: 75.71 },
        { name: 'Кабинет 203а', x1: 8.08, y1: 78.52, x2: 15.33, y2: 86.93 },
        { name: 'Кабинет 203', x1: 16.75, y1: 77.68, x2: 20.42, y2: 86.65 },
        { name: 'Кабинет 202', x1: 21.25, y1: 77.26, x2: 24.5, y2: 86.79 },
        { name: 'Кабинет 201', x1: 25.5, y1: 78.52, x2: 28.25, y2: 86.79 },
        { name: 'Кабинет 200', x1: 29.75, y1: 78.38, x2: 35.08, y2: 86.37 },
        { name: 'Лестница возле лифта', x1: 35, y1: 72.1, x2: 40.92, y2: 76.27 },
        { name: 'Лифт', x1: 34.67, y1: 64.64, x2: 36.67, y2: 70.67 },
        { name: 'Женский туалет', x1: 40.92, y1: 62.97, x2: 44.08, y2: 73.75 },
        { name: 'Кабинет 219', x1: 45.5, y1: 62.53, x2: 53.92, y2: 72.63 },
        { name: 'Кабинет 218', x1: 55.33, y1: 62.11, x2: 65.08, y2: 72.49 },
        { name: 'Кабинет 217', x1: 66.75, y1: 62.95, x2: 78.75, y2: 73.47 },
        { name: 'Кабинет 216а', x1: 80.33, y1: 63.37, x2: 84.25, y2: 73.05 },
        { name: 'Кабинет 216б', x1: 85.33, y1: 62.67, x2: 88.5, y2: 73.89 },
        { name: 'Кабинет 211', x1: 35.5, y1: 45.85, x2: 42.67, y2: 53 },
        { name: 'Кабинет 212', x1: 44.08, y1: 45.85, x2: 46.75, y2: 53.84 },
        { name: 'Кабинет 213', x1: 48.25, y1: 45.15, x2: 59.5, y2: 53 },
        { name: 'Лестница между кабинетами 213 и 214', x1: 61, y1: 45.85, x2: 66.67, y2: 54.4 },
        { name: 'Кабинет 214', x1: 68.42, y1: 45.71, x2: 79.5, y2: 53 },
        { name: 'Кабинет 215', x1: 81.33, y1: 45.15, x2: 85.08, y2: 52.72 }
    ]
};

function findZone(floor, x, y) {
    const zones = floorZones[floor] || [];

    return zones.find((zone) => (
        x >= zone.x1 &&
        x <= zone.x2 &&
        y >= zone.y1 &&
        y <= zone.y2
    ));
}

function getMarkerClass(status) {
    if (status === 'OPEN') return 'floor-map-marker incident-open';
    if (status === 'IN_PROGRESS') return 'floor-map-marker incident-progress';
    return 'floor-map-marker incident-closed';
}

function FloorMap({ incidents = [], onSelectLocation }) {
    const [selectedFloor, setSelectedFloor] = useState(1);
    const [selectedPoint, setSelectedPoint] = useState(null);
    const [selectedPlace, setSelectedPlace] = useState('');
    const [activeIncidentId, setActiveIncidentId] = useState(null);

    const floorIncidents = incidents.filter((item) => (
        item.mapPoint &&
        item.mapPoint.floor === selectedFloor &&
        item.mapPoint.x !== null &&
        item.mapPoint.y !== null
    ));

    function handleMapClick(event) {
        const rect = event.currentTarget.getBoundingClientRect();

        const x = Number((((event.clientX - rect.left) / rect.width) * 100).toFixed(2));
        const y = Number((((event.clientY - rect.top) / rect.height) * 100).toFixed(2));

        const zone = findZone(selectedFloor, x, y);
        const place = zone ? zone.name : 'Точка на плане';

        const locationText = `Корпус АВТФ, этаж ${selectedFloor}, ${place}`;

        const point = {
            floor: selectedFloor,
            x,
            y,
            place
        };

        setSelectedPoint(point);
        setSelectedPlace(locationText);
        setActiveIncidentId(null);

        onSelectLocation(locationText, point);
    }

    return (
        <div className="floor-map-section">
            <div className="floor-map-header">
                <div>
                    <h3>Выбор места на карте корпуса</h3>

                    {selectedPlace && (
                        <p className="floor-map-selected">
                            Выбрано: {selectedPlace}
                        </p>
                    )}
        
                </div>

                <select
                    value={selectedFloor}
                    onChange={(e) => {
                        setSelectedFloor(Number(e.target.value));
                        setSelectedPoint(null);
                        setSelectedPlace('');
                        setActiveIncidentId(null);
                    }}
                >
                    <option value={1}>1 этаж</option>
                    <option value={2}>2 этаж</option>
                </select>
            </div>

            <div className="floor-map-wrapper">
                <img
                    src={`/maps/floor-${selectedFloor}.png`}
                    alt={`${selectedFloor} этаж`}
                    className="floor-map-image"
                    onClick={handleMapClick}
                />

                {floorIncidents.map((incident) => (
                    <div
                        key={incident.id}
                        className={getMarkerClass(incident.status)}
                        style={{
                            left: `${incident.mapPoint.x}%`,
                            top: `${incident.mapPoint.y}%`
                        }}
                        onClick={(e) => {
                            e.stopPropagation();

                            setActiveIncidentId(
                                activeIncidentId === incident.id ? null : incident.id
                            );
                        }}
                    >
                        {activeIncidentId === incident.id && (
                            <div className="incident-tooltip">
                                <strong>{incident.title}</strong>
                                <span>{incident.location}</span>
                                <span>Статус: {incident.status}</span>
                                <span>Ответственный: {incident.responsible}</span>
                                <span>Дата: {incident.date}</span>
                            </div>
                        )}
                    </div>
                ))}

                {selectedPoint && (
                    <div
                        className="floor-map-marker new-incident-marker"
                        style={{
                            left: `${selectedPoint.x}%`,
                            top: `${selectedPoint.y}%`
                        }}
                    />
                )}
            </div>
        </div>
    );
}

export default FloorMap;