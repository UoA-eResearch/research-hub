import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {DateAdapter, NativeDateAdapter} from '@angular/material/core';
import {ApiService} from 'app/services/api.service';
import {AuthService} from '../../services/auth.service';
import {MatHorizontalStepper} from '@angular/material/stepper';
import {AppComponentService} from '../../app.component.service';
import {HttpErrorResponse} from '@angular/common/http';
import {Location} from '@angular/common';
import {MatDialog} from '@angular/material/dialog';
import {ErrorDialogComponent} from '../shared/error-dialog/error-dialog.component';
import {ActivatedRoute} from '@angular/router';
import {Subscription} from 'rxjs/Subscription';
import {AnalyticsService} from '../../services/analytics.service';
import * as format from 'date-fns/format';

interface Person {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  access: string;
  roles: string[];
}


@Component({
  selector: 'app-request-data',
  templateUrl: './request-storage.component.html',
  styleUrls: ['./request-storage.component.scss']
})
export class RequestStorageComponent implements OnInit, OnDestroy {
  private requestFormKey = 'requestDataForm';

  @ViewChild('stepper') stepper: MatHorizontalStepper;
  public dateToday = new Date();
  public submitting = false;
  private routeParamsSub: Subscription;
  private stepperSub: Subscription;
  private dataRequirementsSub: Subscription;
  public title = 'Request Research Storage';
  public image = 'content/vault.jpg';
  public response: any;
  public storageTypeForm: FormGroup;
  public projectForm: FormGroup;
  public dataInfoForm: FormGroup;
  public dataSizeForm: FormGroup;
  private lastStepIndex = 4;
  public isEditable = true;
  public showOtherField = false;

  public fieldOfResearchCodes = [
    '01 Mathematical Sciences',
    '02 Physical Sciences',
    '03 Chemical Sciences',
    '04 Earth Sciences',
    '05 Environmental Sciences',
    '06 Biological Sciences',
    '07 Agricultural and Veterinary Sciences',
    '08 Information and Computing Sciences',
    '09 Engineering',
    '10 Technology',
    '11 Medical and Health Sciences',
    '12 Built Environment and Design',
    '13 Education',
    '14 Economics',
    '15 Commerce, Management, Tourism and Services',
    '16 Studies in Human Society',
    '17 Psychology and Cognitive Sciences',
    '18 Law and Legal Studies',
    '19 Studies in Creative Arts and Writing',
    '20 Language, Communication and Culture',
    '21 History and Archaeology',
    '22 Philosophy and Religious Studies',
    'Other'
  ];

  public dataRequirements = [
    'Part of a funded project research',
    'Requires human ethics research',
    'Requires animal ethics',
    'Part of clinical research',
    'Research involving children',
    'Commercially sensitive',
    'Research involves patent application',
    'Requires encryption on disk',
    'Need for external collaborator access',
    'Requirement to delete data at end of project',
    'Other'
  ];

  public units = [
    'Gigabytes',
    'Terabytes'
  ];

  public access = [
    'Full Access',
    'Read Only'
  ];

  public roleTypes = [
    'Data Owner',
    'Data Contact'
  ];

  constructor(private formBuilder: FormBuilder, dateAdapter: DateAdapter<NativeDateAdapter>,
              public apiService: ApiService, public authService: AuthService, private appComponentService: AppComponentService,
              public dialog: MatDialog, private location: Location, private route: ActivatedRoute,
              private analyticsService: AnalyticsService) {
    dateAdapter.setLocale('en-GB');
  }

  ngOnInit() {
    this.analyticsService.trackIntegratedService(this.title, this.location.path());

    this.storageTypeForm = this.formBuilder.group({
      storageType: new FormControl(undefined, Validators.required)
    });

    this.projectForm = this.formBuilder.group({
      title: new FormControl(undefined, Validators.required),
      abstract: new FormControl(undefined, Validators.required),
      endDate: new FormControl(undefined, Validators.required),
      fieldOfResearch: new FormControl(undefined, Validators.required),
    });

    this.dataInfoForm = this.formBuilder.group({
      dataRequirements: new FormControl(undefined, Validators.required),
      dataRequirementsOther: new FormControl(undefined),
      shortName: new FormControl(undefined, Validators.required),
      projectMembers: this.formBuilder.array([], Validators.compose([Validators.required]))
    });

    this.dataRequirementsSub = this.dataInfoForm.get('dataRequirements').valueChanges.subscribe(
      (items: string[]) => {
        const dataRequirementsOther = this.dataInfoForm.get('dataRequirementsOther');
        this.showOtherField = items && items.find((item) => item === 'Other') !== undefined;

        if (this.showOtherField) {
          dataRequirementsOther.setValidators([Validators.required]);
        } else {
          dataRequirementsOther.setValidators([]);
          dataRequirementsOther.setValue(undefined);
        }
      }
    );

    this.dataSizeForm = this.formBuilder.group({
      sizeThisYear: new FormControl(undefined, [Validators.required, Validators.min(1)]),
      unitThisYear: new FormControl(undefined, Validators.required),
      sizeNextYear: new FormControl(undefined, [Validators.required, Validators.min(1)]),
      unitNextYear: new FormControl(undefined, Validators.required),
      comments: new FormControl(undefined)
    });

    // Pre-populate first person in list with logged in user
    const user = this.authService.user;
    this.addPerson({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.mail,
      username: user.uid,
      access: 'Full Access',
      roles: []
    });

    this.routeParamsSub =
      this.route.queryParams
        .subscribe(params => {
          const retry = params['retry'];

          if (retry) {
            this.loadRequest();
          } else {
            this.clearRequest();
          }
        });

    this.stepperSub = this.stepper.selectionChange.subscribe(selection => {
      this.isEditable = selection.selectedIndex !== this.lastStepIndex;
    });
  }

  saveRequest() {
    const form = {
        storageTypeForm: this.storageTypeForm.getRawValue(),
        projectForm: this.projectForm.getRawValue(),
        dataInfoForm: this.dataInfoForm.getRawValue(),
        dataSizeForm: this.dataSizeForm.getRawValue()
    };

    localStorage.setItem(this.requestFormKey, JSON.stringify(form));
  }

  loadRequest() {
    let form = localStorage.getItem(this.requestFormKey);

    if (form !== null) {
      form = JSON.parse(form);

      this.storageTypeForm.setValue(form['storageTypeForm']);
      this.projectForm.setValue(form['projectForm']);
      this.dataInfoForm.setValue(form['dataInfoForm']);
      this.dataSizeForm.setValue(form['dataSizeForm']);

      this.stepper.selectedIndex = this.lastStepIndex - 1; // Navigate to last step
    }
  }

  clearRequest() {
    localStorage.removeItem(this.requestFormKey)
  }

  addNewPerson() {
    this.addPerson({
      firstName: undefined,
      lastName: undefined,
      email: undefined,
      username: undefined,
      access: undefined,
      roles: []
    });
  }

  addPerson(person: Person) {
    const control = <FormArray>this.dataInfoForm.get('projectMembers');
    control.push(
      this.formBuilder.group({
        firstName: new FormControl(person.firstName, Validators.required),
        lastName: new FormControl(person.lastName, Validators.required),
        email: new FormControl(person.email, Validators.required),
        username: new FormControl(person.username),
        access: new FormControl(person.access, Validators.required),
        roles: new FormControl(person.roles)
      })
    );
  }

  deletePerson(index: number) {
    const control = <FormArray>this.dataInfoForm.get('projectMembers');
    control.removeAt(index);
  }

  ngOnDestroy() {
    this.routeParamsSub.unsubscribe();
    this.stepperSub.unsubscribe();
    this.dataRequirementsSub.unsubscribe();
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
    const isValid = this.dataSizeForm.valid;
    this.dataSizeForm.markAsTouched();
    this.dataSizeForm.markAsDirty();
    this.dataSizeForm.markAsTouched();

    if (isValid) {
      this.submitting = true;

      const body = Object.assign({},
        this.storageTypeForm.getRawValue(),
        this.projectForm.getRawValue(),
        this.dataInfoForm.getRawValue(),
        this.dataSizeForm.getRawValue());

      // Convert endDate into string
      body.endDate = format(body.endDate, 'YYYY-MM-DD');

      this.apiService.requestService('storage', body)
        .subscribe(
          (response) => {
            this.analyticsService.trackActionIntegrated(this.title);
            this.response = response;
            this.stepper.selectedIndex = this.lastStepIndex; // Navigate to last step
          },
          (err: HttpErrorResponse) => {
            this.submitting = false;

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