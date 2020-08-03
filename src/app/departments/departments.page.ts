import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import {
  LoadingController,
  AlertController,
  IonRouterOutlet,
  Platform,
} from '@ionic/angular';
import { Plugins } from '@capacitor/core';
import { Subscription } from 'rxjs';

import { IDepartment } from '../models/department.model';
import { DepartmentService } from '../services/department.service';
import { UtilService } from '../services/util.services';
import { StorageService } from '../services/storage.service';
import { AuthService, refreshTokenErrorCodes } from '../services/auth.service';

@Component({
  selector: 'app-departments',
  templateUrl: './departments.page.html',
  styleUrls: ['./departments.page.scss'],
})
export class DepartmentsPage implements OnInit, OnDestroy {
  isLoading = false;
  isError = false;
  loadedDepartments: IDepartment[];

  loadedDepartmentsSubs = new Subscription();
  selectedDepartmentSub = new Subscription();
  autoLoginSubs = new Subscription();
  anonymousLoginSubs = new Subscription();
  fetchDepartmentsSubs = new Subscription();
  refreshTokenSubs = new Subscription();
  backBtnSubs = new Subscription();

  constructor(
    private departmentService: DepartmentService,
    private router: Router,
    private utilService: UtilService,
    private storageService: StorageService,
    private authService: AuthService,
    private alertController: AlertController,
    private platform: Platform,
    private ionRouterOutlet: IonRouterOutlet
  ) {
    this.backBtnSubs = this.platform.backButton.subscribeWithPriority(
      -1,
      () => {
        if (!this.ionRouterOutlet.canGoBack()) {
          Plugins.App.exitApp();
        }
      }
    );
  }

  ngOnInit() {
    this.onReload();
  }

  navigateToQuestions(departmentID: string) {
    if (
      !this.loadedDepartments.find((depts) => depts.id === departmentID)
        .isComplete
    ) {
      this.router.navigateByUrl(`/departments/${departmentID}`);
    } else {
      this.selectedDepartmentSub = this.departmentService
        .getDepartment(departmentID)
        .subscribe((dept) => {
          this.utilService.showAlertMessage(
            'Completed',
            `Please you have completed the questionnaire for our ${dept.name} department`,
            ['ok']
          );
        });
    }
  }

  onReload() {
    this.storageService.retrieveItem('userInfo').then((uInfo) => {
      if (!uInfo.value) {
        this.router.navigateByUrl('/user-info');
      }
      this.isLoading = true;
      this.isError = false;
      this.autoLoginSubs = this.authService
        .autoLogin()
        .subscribe((autoLoginRes) => {
          if (!autoLoginRes) {
            // if there is no token, sign up
            this.anonymousLoginSubs = this.authService
              .anonymousSignupLogin()
              .subscribe(
                () => {
                  // after signing up, auto login to retrive stored data
                  this.autoLoginSubs = this.authService
                    .autoLogin()
                    .subscribe(() => {
                      this.onFetchDepartments();
                    });
                },
                (err) => {
                  this.isLoading = false;
                  this.isError = true;
                }
              );
          } else {
            this.isLoading = true;
            this.isError = false;
            this.onFetchDepartments();
          }
        });
    });

  }

  private onFetchDepartments() {
    this.isLoading = true;
    this.isError = false;

    this.storageService.retrieveItem('departments').then((value) => {
      const stringifiedValue = value.value;

      // fetch the departments from server to compare to local departments
      this.fetchDepartmentsSubs = this.departmentService
        .fetchDepartments()
        .subscribe(
          (fetchedDepts) => {
            if (stringifiedValue) {
              const arraylisedValue = JSON.parse(
                stringifiedValue
              ) as IDepartment[];

              for (const obj of arraylisedValue) {
                const deptSameAsOnServerIndex = fetchedDepts.findIndex(
                  (d) => d.id === obj.id
                );
                if (deptSameAsOnServerIndex > -1) {
                  fetchedDepts[deptSameAsOnServerIndex].isComplete =
                    obj.isComplete;
                }
              }
            }

            this.departmentService.setDepartments(fetchedDepts);
            this.loadedDepartments = fetchedDepts;
            this.storageService
              .saveItem('departments', fetchedDepts)
              .then(() => {
                this.isLoading = false;
                this.isError = false;
              });
          },
          (err) => {
            this.isError = true;
            this.isLoading = false;
          }
        );
    });
  }

  ngOnDestroy() {
    if (this.loadedDepartmentsSubs) {
      this.loadedDepartmentsSubs.unsubscribe();
    }

    if (this.selectedDepartmentSub) {
      this.selectedDepartmentSub.unsubscribe();
    }
    if (this.autoLoginSubs) {
      this.autoLoginSubs.unsubscribe();
    }

    if (this.anonymousLoginSubs) {
      this.anonymousLoginSubs.unsubscribe();
    }

    if (this.fetchDepartmentsSubs) {
      this.fetchDepartmentsSubs.unsubscribe();
    }

    if (this.refreshTokenSubs) {
      this.refreshTokenSubs.unsubscribe();
    }

    if (this.backBtnSubs) {
      this.backBtnSubs.unsubscribe();
    }
  }
}
