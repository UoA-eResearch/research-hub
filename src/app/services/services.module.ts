import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HttpModule} from '@angular/http';

import {AnalyticsService} from './analytics.service';
import {ApiService} from './api.service';
import {OptionsService} from './options.service';
import {ToolbarService} from './toolbar.service';
import {AuthService} from './auth.service';
import {LayoutService} from './layout.service';


@NgModule({
  imports: [
    CommonModule,
    HttpModule
  ],
  declarations: [],
  providers: [
    AnalyticsService,
    ApiService,
    OptionsService,
    AuthService,
    ToolbarService,
    LayoutService
  ],
  exports: []
})
export class ServicesModule {
}
