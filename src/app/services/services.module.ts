import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HttpClientModule} from '@angular/common/http';
import {AnalyticsService} from './analytics.service';
import {ApiService} from './api.service';
import {OptionsService} from './options.service';
import {AuthService} from './auth.service';
import {LayoutService} from './layout.service';


@NgModule({
  imports: [
    CommonModule,
    HttpClientModule
  ],
  declarations: [],
  providers: [
    AnalyticsService,
    ApiService,
    OptionsService,
    AuthService,
    LayoutService
  ],
  exports: []
})
export class ServicesModule {
}
