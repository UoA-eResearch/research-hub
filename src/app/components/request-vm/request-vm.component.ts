import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {DateAdapter, NativeDateAdapter} from '@angular/material/core';
import {ApiService} from 'app/services/api.service';
import {Content} from 'app/model/Content';
import {AuthService} from '../../services/auth.service';
import {MatHorizontalStepper} from '@angular/material/stepper';
import {AppComponentService} from '../../app.component.service';
import {HttpErrorResponse} from '@angular/common/http';
import {Location} from '@angular/common';
import {MatDialog} from '@angular/material/dialog';
import 'rxjs/add/operator/retryWhen';
import {ErrorDialogComponent} from '../shared/error-dialog/error-dialog.component';
import {ActivatedRoute} from '@angular/router';
import {Subscription} from 'rxjs/Subscription';


@Component({
  selector: 'app-request-vm',
  templateUrl: './request-vm.component.html',
  styleUrls: ['./request-vm.component.scss']
})
export class RequestVmComponent implements OnInit, OnDestroy {

  private static requestVmFormKey = 'requestVmForm';

  @ViewChild('stepper') stepper: MatHorizontalStepper;
  public requestVmForm: FormGroup;
  public times = [];
  public dateToday = new Date();
  public dateCtrl = new FormControl(undefined, Validators.required);
  public timeCtrl = new FormControl(undefined, Validators.required);
  public researchVmContentId = 1;
  public content: Content;
  public submitting = false;
  public response: any;
  private routeParamsSub: Subscription;
  public title = 'Request a Research Virtual Machine';


  private static getTimes() {
    const times = [];

    for (let i = 9; i < 17; i++) {
      let time = '';

      if (i < 10) {
        time += '0';
      }

      time += i;

      times.push(time + ':00');
      times.push(time + ':30');
    }

    return times;
  }

  constructor(private formBuilder: FormBuilder, dateAdapter: DateAdapter<NativeDateAdapter>,
              private apiService: ApiService, public authService: AuthService, private appComponentService: AppComponentService,
              public dialog: MatDialog, private location: Location, private route: ActivatedRoute) {
    dateAdapter.setLocale('en-GB');
  }

  ngOnInit() {
    this.times = RequestVmComponent.getTimes();

    this.requestVmForm = this.formBuilder.group({
      date: this.dateCtrl,
      time: this.timeCtrl,
      comments: ['']
    });

    this.apiService.getContent(this.researchVmContentId).subscribe(
      content => {
        this.content = content;
        this.appComponentService.setTitle(this.title);
      });

    this.routeParamsSub =
      this.route.queryParams
        .subscribe(params => {
          const retry = params['retry'];

          if (retry) {
            this.loadRequest();
            // this.submit();
          } else {
            this.clearRequest();
          }
        });
  }

  ngOnDestroy() {
    this.routeParamsSub.unsubscribe();
  }

  saveRequest() {
    localStorage.setItem(RequestVmComponent.requestVmFormKey, JSON.stringify(this.requestVmForm.getRawValue()));
  }

  loadRequest() {
    const item = localStorage.getItem(RequestVmComponent.requestVmFormKey);

    if (item !== null) {
      const value = JSON.parse(item);
      console.log(RequestVmComponent.requestVmFormKey, value);
      this.requestVmForm.setValue(value);
    }
  }

  clearRequest() {
    localStorage.removeItem(RequestVmComponent.requestVmFormKey)
  }

  showErrorDialog(title: string, message: string, closeButtonName: string, timeout: number) {
    return this.dialog.open(ErrorDialogComponent, {
      data: {
        title: title,
        message: message,
        closeButtonName: closeButtonName,
        timeout: timeout
      }
    });
  }

  submit() {
    const isValid = this.requestVmForm.valid;
    this.dateCtrl.markAsTouched();
    this.timeCtrl.markAsDirty();
    this.timeCtrl.markAsTouched();

    if (isValid) {
      this.submitting = true;
      const values = this.requestVmForm.getRawValue();

      this.apiService.requestVm(values.date, values.time, values.comments)
        .subscribe(
          (response) => {
            this.response = response;
            this.stepper.selectedIndex = 1; // Navigate to second step
            // TODO: set Done step to completed so that a tick appears next to 'Done', doesn't work at the moment
          },
          (err: HttpErrorResponse) => {
            this.submitting = false;
            console.log('Request VM Error: ', err);

            if (err.status === 401) {
              const dialogRef = this.showErrorDialog(
                'Session expired',
                'Redirecting to UoA Single Sign On...',
                'Login',
                5000
              );
              dialogRef.afterClosed().subscribe(result => {
                const url = this.location.path(false) + '?retry=true';
                this.saveRequest();
                this.authService.login(url);
              });
            } else {
              this.showErrorDialog(`${err.name}: ${err.status.toString()}`, JSON.stringify(err.error), 'Close', undefined);
            }
          });
    }
  }
}
