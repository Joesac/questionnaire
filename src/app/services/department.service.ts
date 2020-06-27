import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { take, map, tap } from 'rxjs/operators';

import { IDepartment } from '../models/department.model';

@Injectable({ providedIn: 'root' })
export class DepartmentService {
    private departments = new BehaviorSubject<IDepartment[]>([
        { id: 'd1', name: 'Pharmacy', isComplete: false },
        { id: 'd2', name: 'Front Desk', isComplete: false },
        { id: 'd3', name: 'Consulting Room', isComplete: false },
        { id: 'd4', name: 'Nurses', isComplete: false },
        { id: 'd5', name: 'Laboratory', isComplete: false }
    ]);

    constructor(
        private httpClient: HttpClient
    ) { }

    getDepartments() {
        return this.departments.asObservable();
    }

    fetchDepartments() {
        const depts = [];
        return this.httpClient.get<IDepartment>('https://absh-questionnaire.firebaseio.com/departments.json').pipe(
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
            })
            // tap((departments) => {
            //     this.departments.next(departments);
            // })
        );
    }

    getDepartment(id: string) {
        return this.departments.pipe(take(1),
            map(depts => {
                return { ...depts.find(dpt => dpt.id === id) };
            }));
    }

    setDepartments(departments: IDepartment[]) {
        return this.getDepartments().pipe(take(1), tap(() => {
            this.departments.next(departments);
        }));
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
}
