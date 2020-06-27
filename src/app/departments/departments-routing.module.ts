import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DepartmentsPage } from './departments.page';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: DepartmentsPage
      },
      {
        path: ':departmentId',
        loadChildren: () => import('../question/question.module').then(m => m.QuestionPageModule)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DepartmentsPageRoutingModule {}
