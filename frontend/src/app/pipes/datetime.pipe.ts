import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'datetime',
  standalone: true,
})
export class DateTimePipe implements PipeTransform {
  transform(
    value: string | null | undefined,
    options?: Intl.DateTimeFormatOptions
  ): string {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    const fmt = new Intl.DateTimeFormat('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      ...options,
    });

    return fmt.format(date);
  }
}

