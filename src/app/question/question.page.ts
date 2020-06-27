import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonTextarea, LoadingController, ToastController, AlertController } from '@ionic/angular';
import { Subscription } from 'rxjs';

import { QuestionService } from '../services/question.service';
import { IQuestion } from '../models/questions.model';
import { IDepartment } from '../models/department.model';
import { DepartmentService } from '../services/department.service';
import { UtilService } from '../services/util.services';
import { StorageService } from '../services/storage.service';

@Component({
  selector: 'app-question',
  templateUrl: './question.page.html',
  styleUrls: ['./question.page.scss'],
})
export class QuestionPage implements OnInit, OnDestroy {

  @ViewChild('textArea', { static: false }) publicTextArea: IonTextarea;

  isLoading = false;
  loadedQuestions: IQuestion[];
  currentQuestion: IQuestion;
  selectedDepartment: IDepartment;
  departmentID: string;
  selectedOption: string;
  questionIterator = 0;

  selectedDepartmentSubs = new Subscription();
  completeDeptSubs = new Subscription();
  questionIitializationSubs = new Subscription();

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private questionService: QuestionService,
    private departmentService: DepartmentService,
    private utilService: UtilService,
    private loadingCtrl: LoadingController,
    private storageService: StorageService,
    private toastController: ToastController,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    this.isLoading = true;
    this.activatedRoute.paramMap.subscribe(pMap => {
      if (!pMap.has('departmentId')) {
        this.router.navigateByUrl('/departments');
        return;
      }

      this.departmentID = pMap.get('departmentId');

      this.questionService.getQuestions().subscribe(q => {
        this.loadedQuestions = q;
      });

      this.questionService.fetchQuestion(this.departmentID).subscribe(() => {
        this.isLoading = false;
        this.onShowNextQuestion();
      });

      this.selectedDepartmentSubs = this.departmentService.getDepartment(this.departmentID).subscribe(dept => {
        this.selectedDepartment = dept;
      });
    }, err => {
      this.alertController.create({
        header: 'Error',
        message: `There was a problem. Plese try again later. ${err}`,
        buttons: [{ text: 'okay', handler: () => this.router.navigateByUrl('/departments') }]
      }).then(alertEl => {
        alertEl.present();
      });
    });
  }

  ionViewDidLeave() {
    this.questionService.initializeIterator();
  }

  onShowPreviousQuestion() {
    this.questionService.questionIterator--;

    if (this.questionService.questionIterator < 0) {
      this.questionService.questionIterator = 0;

      this.toastController.create({
        message: 'You are on the first question',
        duration: 2000
      }).then(toastEl => {
        toastEl.present();
      });

    }

    this.questionIterator = this.questionService.questionIterator;
    this.selectedOption = this.loadedQuestions[this.questionIterator].selectedOption;
    this.currentQuestion = this.loadedQuestions[this.questionIterator];
  }

  onShowNextQuestion() {
    this.questionService.questionIterator++;
    this.questionIterator = this.questionService.questionIterator;
    this.selectedOption = this.loadedQuestions[this.questionIterator].selectedOption;
    this.currentQuestion = this.loadedQuestions[this.questionIterator];
  }

  onCompleteDepartmentQuestionnaire(publicOpinion: string) {
    const lastQuestion = this.loadedQuestions[this.loadedQuestions.length - 1];
    if (lastQuestion.isTypable) {
      lastQuestion.typableText = this.publicTextArea.value;
    } else {
      lastQuestion.selectedOption = this.currentQuestion.selectedOption;
    }

    const answers = this.questionService.accumulateAnswers(this.loadedQuestions);
    this.loadingCtrl.create({ message: 'Submitting...' })
      .then(loader => {
        loader.present();

        this.questionService.completeQuestions(answers).subscribe(() => {

          // Set department to complete
          this.completeDeptSubs = this.departmentService.setDepartmentToComplete(this.selectedDepartment).subscribe();
          this.departmentService.getDepartments().subscribe(depts => {
            this.storageService.saveItem('departments', depts);
          });

          loader.remove();
          // this.questionService.initializeQuestions();
          this.router.navigateByUrl('/departments');

          this.toastController.create({
            message: `Thank you for completing the Questionnaire for our ${this.selectedDepartment.name} Department.`,
            duration: 3000
          }).then(toastEl => {
            toastEl.present();
          });
        }, (err) => {
          loader.remove();
          this.utilService.showAlertMessage(
            'Error!',
            'There was an error submitting your answers. Please try again',
            ['ok']
          );
        });
      });
  }

  onOptionSelected(event) {
    this.currentQuestion.selectedOption = event.target.value;
  }

  ngOnDestroy() {
    if (this.selectedDepartmentSubs) {
      this.selectedDepartmentSubs.unsubscribe();
    }

    if (this.completeDeptSubs) {
      this.completeDeptSubs.unsubscribe();
    }

    if (this.questionIitializationSubs) {
      this.questionIitializationSubs.unsubscribe();
    }
  }

}
