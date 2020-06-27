import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController } from '@ionic/angular';
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
  loadedDepartments: IDepartment[];

  loadedDepartmentsSubs = new Subscription();
  selectedDepartmentSub = new Subscription();

  constructor(
    private departmentService: DepartmentService,
    private router: Router,
    private utilService: UtilService,
    private storageService: StorageService,
    private loadingCtrler: LoadingController,
  ) { }

  ngOnInit() {
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

        this.departmentService.setDepartments(fetchedDepts).subscribe();
        this.loadedDepartments = fetchedDepts;
        this.storageService.saveItem('departments', fetchedDepts).then(() => {
          this.isLoading = false;
        });
      });
    });
  }

  navigateToQuestions(departmentID: string) {
    // let lCtrler;
    // let canNavigate = false;

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

  ngOnDestroy() {
    if (this.loadedDepartmentsSubs) {
      this.loadedDepartmentsSubs.unsubscribe();
    }

    if (this.selectedDepartmentSub) {
      this.selectedDepartmentSub.unsubscribe();
    }
  }
}
