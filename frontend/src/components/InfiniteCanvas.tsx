import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import Konva from 'konva';

interface Stroke {
    id: string;
    points: { x: number; y: number }[];
    color: string;
    width: number;
}

interface InfiniteCanvasProps {
    strokes: Stroke[];
    currentStroke: Stroke | null;
    onStrokeStart: (point: { x: number; y: number }) => void;
    onStrokeMove: (point: { x: number; y: number }) => void;
    onStrokeEnd: () => void;
    enabled: boolean;
    color: string;
}

export const InfiniteCanvas: React.FC<InfiniteCanvasProps> = ({
    strokes,
    currentStroke,
    onStrokeStart,
    onStrokeMove,
    onStrokeEnd,
    enabled,
    color,
}) => {
    const stageRef = useRef<Konva.Stage>(null);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    // Zoom handling
    const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
        e.evt.preventDefault();

        const stage = stageRef.current;
        if (!stage) return;

        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();

        if (!pointer) return;

        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };

        const newScale = e.evt.deltaY > 0 ? oldScale * 0.9 : oldScale * 1.1;

        stage.scale({ x: newScale, y: newScale });
        setScale(newScale);

        const newPos = {
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        };

        stage.position(newPos);
        setPosition(newPos);
    };

    // Drawing handling
    const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (!enabled || e.evt.button !== 0) return; // Only left click for drawing

        const stage = stageRef.current;
        if (!stage) return;

        const pointer = stage.getRelativePointerPosition();
        if (pointer) {
            onStrokeStart(pointer);
        }
    };

    const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (!enabled || !currentStroke) return;

        const stage = stageRef.current;
        if (!stage) return;

        const pointer = stage.getRelativePointerPosition();
        if (pointer) {
            onStrokeMove(pointer);
        }
    };

    const handleMouseUp = () => {
        if (currentStroke) {
            onStrokeEnd();
        }
    };

    // Cursor style
    useEffect(() => {
        if (stageRef.current) {
            stageRef.current.container().style.cursor = enabled ? 'crosshair' : 'default';
        }
    }, [enabled]);

    return (
        <Stage
            width={window.innerWidth}
            height={window.innerHeight}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleMouseDown} // Basic touch support
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
            ref={stageRef}
            draggable={!enabled} // Drag to pan when not drawing
            x={position.x}
            y={position.y}
            scaleX={scale}
            scaleY={scale}
        >
            <Layer>
                <Grid width={window.innerWidth} height={window.innerHeight} scale={scale} stageX={position.x} stageY={position.y} />
            </Layer>
            <Layer>
                {strokes.map((stroke) => (
                    <Line
                        key={stroke.id}
                        points={stroke.points.flatMap(p => [p.x, p.y])}
                        stroke={stroke.color}
                        strokeWidth={stroke.width}
                        tension={0.5}
                        lineCap="round"
                        lineJoin="round"
                    />
                ))}
                {currentStroke && (
                    <Line
                        points={currentStroke.points.flatMap(p => [p.x, p.y])}
                        stroke={color}
                        strokeWidth={currentStroke.width}
                        tension={0.5}
                        lineCap="round"
                        lineJoin="round"
                    />
                )}
            </Layer>
        </Stage>
    );
};

const Grid: React.FC<{ width: number; height: number; scale: number; stageX: number; stageY: number }> = ({ width, height, scale, stageX, stageY }) => {
    const GRID_SIZE = 50;

    // Calculate visible range in world coordinates
    const startX = Math.floor((-stageX / scale) / GRID_SIZE) * GRID_SIZE;
    const endX = Math.floor((-stageX + width) / scale / GRID_SIZE) * GRID_SIZE;

    const startY = Math.floor((-stageY / scale) / GRID_SIZE) * GRID_SIZE;
    const endY = Math.floor((-stageY + height) / scale / GRID_SIZE) * GRID_SIZE;

    const lines = [];

    // Vertical lines
    for (let x = startX; x <= endX; x += GRID_SIZE) {
        lines.push(
            <Line
                key={`v-${x}`}
                points={[x, startY, x, endY]}
                stroke="#ddd"
                strokeWidth={1 / scale}
            />
        );
    }

    // Horizontal lines
    for (let y = startY; y <= endY; y += GRID_SIZE) {
        lines.push(
            <Line
                key={`h-${y}`}
                points={[startX, y, endX, y]}
                stroke="#ddd"
                strokeWidth={1 / scale}
            />
        );
    }

    return <>{lines}</>;
};
