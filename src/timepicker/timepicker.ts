import {
	ChangeDetectorRef,
	Component,
	forwardRef,
	Input,
	OnChanges,
	SimpleChanges,
	ViewEncapsulation,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { isInteger, isNumber, padNumber, toInteger } from '../util/util';
import { NgbTime } from './ngb-time';
import { NgbTimepickerConfig } from './timepicker-config';
import { NgbTimeAdapter } from './ngb-time-adapter';
import { NgbTimepickerI18n } from './timepicker-i18n';

const FILTER_REGEX = /[^0-9]/g;

/**
 * A directive that helps with wth picking hours, minutes and seconds.
 */
@Component({
	exportAs: 'ngbTimepicker',
	selector: 'ngb-timepicker',
	encapsulation: ViewEncapsulation.None,
	styleUrl: './timepicker.scss',
	template: `
		<fieldset [disabled]="disabled" [class.disabled]="disabled">
			<div class="ngb-tp">
				<div class="ngb-tp-input-container ngb-tp-hour">
					@if (spinners) {
						<button
							tabindex="-1"
							type="button"
							(click)="changeHour(hourStep)"
							class="btn btn-link"
							[class.btn-sm]="isSmallSize"
							[class.btn-lg]="isLargeSize"
							[class.disabled]="disabled"
							[disabled]="disabled"
						>
							<span class="chevron ngb-tp-chevron"></span>
							<span class="visually-hidden" i18n="@@ngb.timepicker.increment-hours">Increment hours</span>
						</button>
					}
					<input
						type="text"
						class="ngb-tp-input form-control"
						[class.form-control-sm]="isSmallSize"
						[class.form-control-lg]="isLargeSize"
						maxlength="2"
						inputmode="numeric"
						placeholder="HH"
						i18n-placeholder="@@ngb.timepicker.HH"
						[value]="formatHour(model?.hour)"
						(change)="updateHour($any($event).target.value)"
						[readOnly]="readonlyInputs"
						[disabled]="disabled"
						aria-label="Hours"
						i18n-aria-label="@@ngb.timepicker.hours"
						(blur)="handleBlur()"
						(input)="formatInput($any($event).target)"
						(keydown.ArrowUp)="changeHour(hourStep); $event.preventDefault()"
						(keydown.ArrowDown)="changeHour(-hourStep); $event.preventDefault()"
					/>
					@if (spinners) {
						<button
							tabindex="-1"
							type="button"
							(click)="changeHour(-hourStep)"
							class="btn btn-link"
							[class.btn-sm]="isSmallSize"
							[class.btn-lg]="isLargeSize"
							[class.disabled]="disabled"
							[disabled]="disabled"
						>
							<span class="chevron ngb-tp-chevron bottom"></span>
							<span class="visually-hidden" i18n="@@ngb.timepicker.decrement-hours">Decrement hours</span>
						</button>
					}
				</div>
				<div class="ngb-tp-spacer">:</div>
				<div class="ngb-tp-input-container ngb-tp-minute">
					@if (spinners) {
						<button
							tabindex="-1"
							type="button"
							(click)="changeMinute(minuteStep)"
							class="btn btn-link"
							[class.btn-sm]="isSmallSize"
							[class.btn-lg]="isLargeSize"
							[class.disabled]="disabled"
							[disabled]="disabled"
						>
							<span class="chevron ngb-tp-chevron"></span>
							<span class="visually-hidden" i18n="@@ngb.timepicker.increment-minutes">Increment minutes</span>
						</button>
					}
					<input
						type="text"
						class="ngb-tp-input form-control"
						[class.form-control-sm]="isSmallSize"
						[class.form-control-lg]="isLargeSize"
						maxlength="2"
						inputmode="numeric"
						placeholder="MM"
						i18n-placeholder="@@ngb.timepicker.MM"
						[value]="formatMinSec(model?.minute)"
						(change)="updateMinute($any($event).target.value)"
						[readOnly]="readonlyInputs"
						[disabled]="disabled"
						aria-label="Minutes"
						i18n-aria-label="@@ngb.timepicker.minutes"
						(blur)="handleBlur()"
						(input)="formatInput($any($event).target)"
						(keydown.ArrowUp)="changeMinute(minuteStep); $event.preventDefault()"
						(keydown.ArrowDown)="changeMinute(-minuteStep); $event.preventDefault()"
					/>
					@if (spinners) {
						<button
							tabindex="-1"
							type="button"
							(click)="changeMinute(-minuteStep)"
							class="btn btn-link"
							[class.btn-sm]="isSmallSize"
							[class.btn-lg]="isLargeSize"
							[class.disabled]="disabled"
							[disabled]="disabled"
						>
							<span class="chevron ngb-tp-chevron bottom"></span>
							<span class="visually-hidden" i18n="@@ngb.timepicker.decrement-minutes">Decrement minutes</span>
						</button>
					}
				</div>
				@if (seconds) {
					<div class="ngb-tp-spacer">:</div>
					<div class="ngb-tp-input-container ngb-tp-second">
						@if (spinners) {
							<button
								tabindex="-1"
								type="button"
								(click)="changeSecond(secondStep)"
								class="btn btn-link"
								[class.btn-sm]="isSmallSize"
								[class.btn-lg]="isLargeSize"
								[class.disabled]="disabled"
								[disabled]="disabled"
							>
								<span class="chevron ngb-tp-chevron"></span>
								<span class="visually-hidden" i18n="@@ngb.timepicker.increment-seconds">Increment seconds</span>
							</button>
						}
						<input
							type="text"
							class="ngb-tp-input form-control"
							[class.form-control-sm]="isSmallSize"
							[class.form-control-lg]="isLargeSize"
							maxlength="2"
							inputmode="numeric"
							placeholder="SS"
							i18n-placeholder="@@ngb.timepicker.SS"
							[value]="formatMinSec(model?.second)"
							(change)="updateSecond($any($event).target.value)"
							[readOnly]="readonlyInputs"
							[disabled]="disabled"
							aria-label="Seconds"
							i18n-aria-label="@@ngb.timepicker.seconds"
							(blur)="handleBlur()"
							(input)="formatInput($any($event).target)"
							(keydown.ArrowUp)="changeSecond(secondStep); $event.preventDefault()"
							(keydown.ArrowDown)="changeSecond(-secondStep); $event.preventDefault()"
						/>
						@if (spinners) {
							<button
								tabindex="-1"
								type="button"
								(click)="changeSecond(-secondStep)"
								class="btn btn-link"
								[class.btn-sm]="isSmallSize"
								[class.btn-lg]="isLargeSize"
								[class.disabled]="disabled"
								[disabled]="disabled"
							>
								<span class="chevron ngb-tp-chevron bottom"></span>
								<span class="visually-hidden" i18n="@@ngb.timepicker.decrement-seconds">Decrement seconds</span>
							</button>
						}
					</div>
				}
				@if (meridian) {
					<div class="ngb-tp-spacer"></div>
					<div class="ngb-tp-meridian">
						<button
							type="button"
							class="btn btn-outline-primary"
							[class.btn-sm]="isSmallSize"
							[class.btn-lg]="isLargeSize"
							[disabled]="disabled"
							[class.disabled]="disabled"
							(click)="toggleMeridian()"
						>
							@if (model && model.hour >= 12) {
								<ng-container i18n="@@ngb.timepicker.PM">{{ i18n.getAfternoonPeriod() }}</ng-container>
							} @else {
								<ng-container>{{ i18n.getMorningPeriod() }}</ng-container>
							}
						</button>
					</div>
				}
			</div>
		</fieldset>
	`,
	providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => NgbTimepicker), multi: true }],
})
export class NgbTimepicker implements ControlValueAccessor, OnChanges {
	static ngAcceptInputType_size: string;

	disabled: boolean;
	model?: NgbTime;

	private _hourStep: number;
	private _minuteStep: number;
	private _secondStep: number;

	/**
	 * Whether to display 12H or 24H mode.
	 */
	@Input() meridian: boolean;

	/**
	 * If `true`, the spinners above and below inputs are visible.
	 */
	@Input() spinners: boolean;

	/**
	 * If `true`, it is possible to select seconds.
	 */
	@Input() seconds: boolean;

	/**
	 * The number of hours to add/subtract when clicking hour spinners.
	 */
	@Input()
	set hourStep(step: number) {
		this._hourStep = isInteger(step) ? step : this._config.hourStep;
	}

	get hourStep(): number {
		return this._hourStep;
	}

	/**
	 * The number of minutes to add/subtract when clicking minute spinners.
	 */
	@Input()
	set minuteStep(step: number) {
		this._minuteStep = isInteger(step) ? step : this._config.minuteStep;
	}

	get minuteStep(): number {
		return this._minuteStep;
	}

	/**
	 * The number of seconds to add/subtract when clicking second spinners.
	 */
	@Input()
	set secondStep(step: number) {
		this._secondStep = isInteger(step) ? step : this._config.secondStep;
	}

	get secondStep(): number {
		return this._secondStep;
	}

	/**
	 * If `true`, the timepicker is readonly and can't be changed.
	 */
	@Input() readonlyInputs: boolean;

	/**
	 * The size of inputs and buttons.
	 */
	@Input() size: 'small' | 'medium' | 'large';

	constructor(
		private readonly _config: NgbTimepickerConfig,
		private _ngbTimeAdapter: NgbTimeAdapter<any>,
		private _cd: ChangeDetectorRef,
		public i18n: NgbTimepickerI18n,
	) {
		this.meridian = _config.meridian;
		this.spinners = _config.spinners;
		this.seconds = _config.seconds;
		this.hourStep = _config.hourStep;
		this.minuteStep = _config.minuteStep;
		this.secondStep = _config.secondStep;
		this.disabled = _config.disabled;
		this.readonlyInputs = _config.readonlyInputs;
		this.size = _config.size;
	}

	onChange = (_: any) => {};
	onTouched = () => {};

	writeValue(value) {
		const structValue = this._ngbTimeAdapter.fromModel(value);
		this.model = structValue ? new NgbTime(structValue.hour, structValue.minute, structValue.second) : new NgbTime();
		if (!this.seconds && (!structValue || !isNumber(structValue.second))) {
			this.model.second = 0;
		}
		this._cd.markForCheck();
	}

	registerOnChange(fn: (value: any) => any): void {
		this.onChange = fn;
	}

	registerOnTouched(fn: () => any): void {
		this.onTouched = fn;
	}

	setDisabledState(isDisabled: boolean) {
		this.disabled = isDisabled;
	}

	/**
	 * Increments the hours by the given step.
	 */
	changeHour(step: number) {
		this.model?.changeHour(step);
		this.propagateModelChange();
	}

	/**
	 * Increments the minutes by the given step.
	 */
	changeMinute(step: number) {
		this.model?.changeMinute(step);
		this.propagateModelChange();
	}

	/**
	 * Increments the seconds by the given step.
	 */
	changeSecond(step: number) {
		this.model?.changeSecond(step);
		this.propagateModelChange();
	}

	/**
	 * Update hours with the new value.
	 */
	updateHour(newVal: string) {
		const isPM = this.model ? this.model.hour >= 12 : false;
		const enteredHour = toInteger(newVal);
		if (this.meridian && ((isPM && enteredHour < 12) || (!isPM && enteredHour === 12))) {
			this.model?.updateHour(enteredHour + 12);
		} else {
			this.model?.updateHour(enteredHour);
		}
		this.propagateModelChange();
	}

	/**
	 * Update minutes with the new value.
	 */
	updateMinute(newVal: string) {
		this.model?.updateMinute(toInteger(newVal));
		this.propagateModelChange();
	}

	/**
	 * Update seconds with the new value.
	 */
	updateSecond(newVal: string) {
		this.model?.updateSecond(toInteger(newVal));
		this.propagateModelChange();
	}

	toggleMeridian() {
		if (this.model && isNumber(this.model.hour) && this.meridian) {
			this.changeHour(12);
		}
	}

	formatInput(input: HTMLInputElement) {
		input.value = input.value.replace(FILTER_REGEX, '');
	}

	formatHour(value?: number) {
		if (isNumber(value)) {
			if (this.meridian) {
				return padNumber(value % 12 === 0 ? 12 : value % 12);
			} else {
				return padNumber(value % 24);
			}
		} else {
			return padNumber(NaN);
		}
	}

	formatMinSec(value?: number) {
		return padNumber(isNumber(value) ? value : NaN);
	}

	handleBlur() {
		this.onTouched();
	}

	get isSmallSize(): boolean {
		return this.size === 'small';
	}

	get isLargeSize(): boolean {
		return this.size === 'large';
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['seconds'] && !this.seconds && this.model && !isNumber(this.model.second)) {
			this.model.second = 0;
			this.propagateModelChange(false);
		}
	}

	private propagateModelChange(touched = true) {
		if (touched) {
			this.onTouched();
		}
		if (this.model?.isValid(this.seconds)) {
			this.onChange(
				this._ngbTimeAdapter.toModel({ hour: this.model.hour, minute: this.model.minute, second: this.model.second }),
			);
		} else {
			this.onChange(this._ngbTimeAdapter.toModel(null));
		}
	}
}
