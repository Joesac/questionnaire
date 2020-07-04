import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController, AlertController } from '@ionic/angular';
import { Subscription } from 'rxjs';

import { IDepartment } from '../models/department.model';
import { DepartmentService } from '../services/department.service';
import { UtilService } from '../services/util.services';
import { StorageService } from '../services/storage.service';

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

  constructor(
    private departmentService: DepartmentService,
    private router: Router,
    private utilService: UtilService,
    private storageService: StorageService,
    private loadingCtrler: LoadingController,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    this.isLoading = true;
    this.onFetchDepartments();
  }

  navigateToQuestions(departmentID: string) {
    if (!this.loadedDepartments.find((depts) => depts.id === departmentID).isComplete) {
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

  onFetchDepartments() {
    this.isLoading = true;
    this.storageService.retrieveItem('departments').then((value) => {
      const stringifiedValue = value.value;

      // fetch the departments from server
      this.departmentService.fetchDepartments().subscribe(fetchedDepts => {

        if (stringifiedValue) {
          const arraylisedValue = JSON.parse(stringifiedValue) as IDepartment[];

          for (const obj of arraylisedValue) {
            const deptSameAsOnServerIndex = fetchedDepts.findIndex(d => d.id === obj.id);
            if (deptSameAsOnServerIndex > -1) {
              fetchedDepts[deptSameAsOnServerIndex].isComplete = obj.isComplete;
            }
          }
        }

        this.departmentService.setDepartments(fetchedDepts);
        this.loadedDepartments = fetchedDepts;
        this.storageService.saveItem('departments', fetchedDepts).then(() => {
          this.isLoading = false;
          this.isError = false;
        });
      }, err => {
        this.isError = true;
        this.isLoading = false;
        this.alertController.create({
          header: 'Error',
          message: 'There was an error getting departments. Please check your internet connection and try again.',
          buttons: ['okay']
        }).then(alertEl => {
          alertEl.present();
        });
      });
    });
  }

  ngOnDestroy() {
    if (this.loadedDepartmentsSubs) {
      this.loadedDepartmentsSubs.unsubscribe();
    }

    if (this.selectedDepartmentSub) {
      this.selectedDepartmentSub.unsubscribe();
    }
  }
}
