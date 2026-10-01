export function roomTimeObjectsMarkup(): string {
  return `<div class="ph-time-objects" aria-label="Room settings">
    <button class="ph-desk-clock ph-time-object" type="button" data-action="clock" aria-haspopup="dialog" aria-label="Open time and atmosphere settings">
      <img class="ph-time-object-art" src="/assets/penthouse/objects/digital-clock.webp" alt="" aria-hidden="true" draggable="false">
      <span class="ph-digital-time" aria-hidden="true">00:00</span>
      <span class="ph-time-object-label">Time &amp; atmosphere</span>
    </button>
    <button class="ph-desk-calendar ph-time-object" type="button" data-action="calendar" aria-haspopup="dialog" aria-label="Open calendar and season settings">
      <img class="ph-time-object-art" src="/assets/penthouse/objects/desk-calendar.webp" alt="" aria-hidden="true" draggable="false">
      <span class="ph-calendar-print" aria-hidden="true">
        <span class="ph-calendar-month"></span>
        <span class="ph-calendar-date">·</span>
        <span class="ph-calendar-weekday"></span>
      </span>
      <span class="ph-time-object-label">Calendar &amp; seasons</span>
    </button>
  </div>`
}

export function updateRoomTimeObjects(root: HTMLElement, timeZone: string, now = new Date()): void {
  const dateParts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    month: 'short',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const fields = new Map(dateParts.map(part => [part.type, part.value]))
  const time = new Intl.DateTimeFormat('en-US', { timeZone, timeStyle: 'short' }).format(now)
  const date = new Intl.DateTimeFormat('en-US', { timeZone, dateStyle: 'full' }).format(now)

  root.querySelectorAll<HTMLElement>('.ph-desk-clock').forEach(clock => {
    clock.setAttribute('aria-label', `${time}. Open time and atmosphere settings`)
  })
  root.querySelectorAll<HTMLElement>('.ph-digital-time').forEach(display => {
    display.textContent = `${fields.get('hour') ?? '00'}:${fields.get('minute') ?? '00'}`
  })
  root.querySelectorAll<HTMLElement>('.ph-desk-calendar').forEach(calendar => {
    calendar.setAttribute('aria-label', `${date}. Open calendar and season settings`)
  })
  for (const [selector, part] of [
    ['.ph-calendar-month', 'month'],
    ['.ph-calendar-date', 'day'],
    ['.ph-calendar-weekday', 'weekday'],
  ] as const) {
    root.querySelectorAll<HTMLElement>(selector).forEach(node => {
      node.textContent = fields.get(part) ?? ''
    })
  }
}
