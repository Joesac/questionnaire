import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { take, map, tap, switchMap } from 'rxjs/operators';

import { IDepartment } from '../models/department.model';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DepartmentService {
    private departments = new BehaviorSubject<IDepartment[]>([]);

    constructor(
        private httpClient: HttpClient,
        private authService: AuthService
    ) { }

    getDepartments() {
        return this.departments.asObservable();
    }

    fetchDepartments() {
        const depts = [];
        return this.authService.token.pipe(
            take(1),
            switchMap(token => {
                return this.httpClient.get<IDepartment>(`${environment.databaseURL}/departments.json?auth=${token}`);
            }),
            take(1),
            map(fetchedDepartments => {
                for (const key in fetchedDepartments) {
                    if (fetchedDepartments.hasOwnProperty(key)) {
                        depts.push({
                            id: key,
                            name: fetchedDepartments[key].name,
                            isComplete: false
                        });
                    }
                }
                return depts;
            }),
            tap((departments) => {
                this.departments.next(departments);
            })
        );
    }

    getDepartment(id: string) {
        return this.departments.pipe(take(1),
            map(depts => {
                return { ...depts.find(dpt => dpt.id === id) };
            }));
    }

    setDepartments(departments: IDepartment[]) {
        this.getDepartments().pipe(take(1), tap(() => {
            this.departments.next(departments);
        })).subscribe();
    }

    setDepartmentToComplete(department: IDepartment) {
        return this.departments.pipe(
            take(1),
            map(dept => {
                const completedDpt = dept.find(dpt => dpt.id === department.id);
                completedDpt.isComplete = true;
                this.departments.next(dept);
            }));
    }

    isAllDepartmentsComplete(depts: IDepartment[]) {
        for (const d of depts) {
            if (!d.isComplete) {
                return false;
            }
        }
        return true;
    }
}
