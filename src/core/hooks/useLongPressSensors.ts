import { useSensor, useSensors, PointerSensor, TouchSensor, KeyboardSensor } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

/**
 * Hook que configura sensores de drag-and-drop otimizados para mobile e desktop.
 * 
 * Mobile (touch): Long press de 400ms para ativar o drag
 * - Se mover mais de 8px antes do delay, cancela o drag e permite scroll
 * - Feedback háptico deve ser disparado no onDragStart
 * 
 * Desktop (mouse): Drag imediato após mover 8px
 */
export function useLongPressSensors() {
  // Detectar se é dispositivo touch
  const isTouchDevice = typeof window !== 'undefined' && 
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  // Sensor para touch: long press de 400ms
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 400, // Long press de 400ms
      tolerance: 8, // Se mover mais que 8px, cancela e vira scroll
    },
  });

  // Sensor para mouse: drag imediato após 8px de movimento
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8, // Evitar drag acidental
    },
  });

  // Sensor de teclado para acessibilidade
  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  });

  // Mobile: TouchSensor com delay + Keyboard
  // Desktop: PointerSensor + Keyboard
  return useSensors(
    isTouchDevice ? touchSensor : pointerSensor,
    keyboardSensor
  );
}

/**
 * Dispara feedback háptico leve para indicar que o drag foi ativado.
 * Deve ser chamado no onDragStart de cada DndContext.
 */
export function triggerHapticFeedback() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(15); // 15ms de vibração leve
  }
}
