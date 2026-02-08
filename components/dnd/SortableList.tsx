// components/dnd/SortableList.tsx
"use client";

import * as React from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export type SortableItem = { id: string };

function SortableRow(props: {
  id: string;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: props.id, disabled: props.disabled });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative",
        isDragging && "opacity-90",
        props.className
      )}
    >
      {/* Drag handle */}
      <button
        type="button"
        className={cn(
          "absolute left-2 top-3 rounded p-1",
          props.disabled ? "cursor-not-allowed opacity-40" : "cursor-grab"
        )}
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
        disabled={props.disabled}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="pl-10">{props.children}</div>
    </div>
  );
}

export function SortableList<T extends SortableItem>(props: {
  items: T[];
  disabled?: boolean;
  onReorder: (next: T[]) => void;
  renderItem: (item: T) => React.ReactNode;
  itemClassName?: string;
  containerClassName?: string;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const ids = React.useMemo(() => props.items.map((x) => x.id), [props.items]);

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;
    if (active.id === over.id) return;

    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(props.items, oldIndex, newIndex);
    props.onReorder(next);
  };

  return (
    <div className={props.containerClassName}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {props.items.map((item) => (
              <SortableRow
                key={item.id}
                id={item.id}
                disabled={props.disabled}
                className={props.itemClassName}
              >
                {props.renderItem(item)}
              </SortableRow>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
