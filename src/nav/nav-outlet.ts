import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Directive,
	ElementRef,
	inject,
	Input,
	NgZone,
	QueryList,
	ViewChildren,
	ViewEncapsulation,
} from '@angular/core';
import { distinctUntilChanged, skip, startWith } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ngbNavFadeInTransition, ngbNavFadeOutTransition } from './nav-transition';
import { ngbRunTransition, NgbTransitionOptions } from '../util/transition/ngbTransition';
import { NgbNav, NgbNavItem } from './nav';
import { NgTemplateOutlet } from '@angular/common';

@Directive({
	selector: '[ngbNavPane]',
	host: {
		'[id]': 'item.panelDomId',
		class: 'tab-pane',
		'[class.fade]': 'nav.animation',
		'[attr.role]': 'role ? role : nav.roles ? "tabpanel" : undefined',
		'[attr.aria-labelledby]': 'item.domId',
	},
})
export class NgbNavPane {
	nativeElement = inject(ElementRef).nativeElement as HTMLElement;

	@Input() item: NgbNavItem;
	@Input() nav: NgbNav;
	@Input() role: string;
}

/**
 * The outlet where currently active nav content will be displayed.
 *
 * @since 5.2.0
 */
@Component({
	selector: '[ngbNavOutlet]',
	imports: [NgbNavPane, NgTemplateOutlet],
	host: {
		class: 'tab-content',
	},
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		@for (item of nav.items; track item) {
			@if (item.isPanelInDom() || isPanelTransitioning(item)) {
				<div ngbNavPane [item]="item" [nav]="nav" [role]="paneRole">
					<ng-template
						[ngTemplateOutlet]="item.contentTpl?.templateRef || null"
						[ngTemplateOutletContext]="{ $implicit: item.active || isPanelTransitioning(item) }"
					/>
				</div>
			}
		}
	`,
})
export class NgbNavOutlet implements AfterViewInit {
	private _cd = inject(ChangeDetectorRef);
	private _ngZone = inject(NgZone);

	private _activePane: NgbNavPane | null = null;

	@ViewChildren(NgbNavPane) private _panes: QueryList<NgbNavPane>;

	/**
	 * A role to set on the nav pane
	 */
	@Input() paneRole;

	/**
	 * Reference to the `NgbNav`
	 */
	@Input('ngbNavOutlet') nav: NgbNav;

	isPanelTransitioning(item: NgbNavItem) {
		return this._activePane?.item === item;
	}

	ngAfterViewInit() {
		// initial display
		this._updateActivePane();

		// this will be emitted for all 3 types of nav changes: .select(), [activeId] or (click)
		this.nav.navItemChange$
			.pipe(
				takeUntilDestroyed(this.nav.destroyRef),
				startWith(this._activePane?.item || null),
				distinctUntilChanged(),
				skip(1),
			)
			.subscribe((nextItem) => {
				const options: NgbTransitionOptions<undefined> = { animation: this.nav.animation, runningTransition: 'stop' };

				// next panel we're switching to will only appear in DOM after the change detection is done
				// and `this._panes` will be updated
				this._cd.detectChanges();

				// fading out
				if (this._activePane) {
					ngbRunTransition(this._ngZone, this._activePane.nativeElement, ngbNavFadeOutTransition, options).subscribe(
						() => {
							const activeItem = this._activePane?.item;
							this._activePane = this._getPaneForItem(nextItem);

							// mark for check when transition finishes as outlet or parent containers might be OnPush
							// without this the panes that have "faded out" will stay in DOM
							this._cd.markForCheck();

							// fading in
							if (this._activePane) {
								// we have to add the '.active' class before running the transition,
								// because it should be in place before `ngbRunTransition` does `reflow()`
								this._activePane.nativeElement.classList.add('active');
								ngbRunTransition(
									this._ngZone,
									this._activePane.nativeElement,
									ngbNavFadeInTransition,
									options,
								).subscribe(() => {
									if (nextItem) {
										nextItem.shown.emit();
										this.nav.shown.emit(nextItem.id);
									}
								});
							}

							if (activeItem) {
								activeItem.hidden.emit();
								this.nav.hidden.emit(activeItem.id);
							}
						},
					);
				} else {
					this._updateActivePane();
				}
			});
	}

	private _updateActivePane() {
		this._activePane = this._getActivePane();
		this._activePane?.nativeElement.classList.add('show', 'active');
	}

	private _getPaneForItem(item: NgbNavItem | null) {
		return (this._panes && this._panes.find((pane) => pane.item === item)) || null;
	}

	private _getActivePane(): NgbNavPane | null {
		return (this._panes && this._panes.find((pane) => pane.item.active)) || null;
	}
}
