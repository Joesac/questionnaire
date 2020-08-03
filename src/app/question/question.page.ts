import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonTextarea, LoadingController, ToastController, AlertController, Platform, IonRouterOutlet, IonButton } from '@ionic/angular';
import { Plugins } from '@capacitor/core';
import { Subscription } from 'rxjs';

import { QuestionService } from '../services/question.service';
import { IQuestion } from '../models/questions.model';
import { IDepartment } from '../models/department.model';
import { DepartmentService } from '../services/department.service';
import { UtilService } from '../services/util.services';
import { StorageService } from '../services/storage.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-question',
  templateUrl: './question.page.html',
  styleUrls: ['./question.page.scss'],
})
export class QuestionPage implements OnInit, OnDestroy {

  @ViewChild('textArea', { static: false }) publicTextArea: IonTextarea;
  @ViewChild('btnComplete', { static: false }) btnComplete: IonButton;

  isLoading = false;
  isError = false;
  loadedQuestions: IQuestion[];
  currentQuestion: IQuestion;
  selectedDepartment: IDepartment;
  departmentID: string;
  selectedOption: string;
  selectedOptionLabel: string;
  questionIterator = 0;
  userInfo: string;

  selectedDepartmentSubs = new Subscription();
  completeDeptSubs = new Subscription();
  questionIitializationSubs = new Subscription();
  fetchedQuestsSubs = new Subscription();
  getQuestionsSubs = new Subscription();
  completeQuestsSubs = new Subscription();
  getDeptsSubs = new Subscription();
  autoLoginSubs = new Subscription();
  anonymousLoginSubs = new Subscription();
  getDepartmentsSubs = new Subscription();
  fetchDepartmentsSubs = new Subscription();
  getDepartmentSubs = new Subscription();
  backBtnSubs = new Subscription();
  isAllDComplteSubs = new Subscription();

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private questionService: QuestionService,
    private departmentService: DepartmentService,
    private utilService: UtilService,
    private loadingCtrl: LoadingController,
    private storageService: StorageService,
    private toastController: ToastController,
    private alertController: AlertController,
    private authService: AuthService,
    private platform: Platform,
    private ionRouterOutlet: IonRouterOutlet
  ) {
    this.backBtnSubs = this.platform.backButton.subscribeWithPriority(-1, () => {
      if (!this.ionRouterOutlet.canGoBack()) {
        Plugins.App.exitApp();
      }
    });
  }

  ngOnInit() {
    this.isLoading = true;

    this.storageService.retrieveItem('userInfo').then(uInfo => {
      this.userInfo = uInfo.value;
    });

    this.autoLoginSubs = this.authService.autoLogin().subscribe(autoLoginData => {
      if (!autoLoginData) {
        this.anonymousLoginSubs = this.authService.anonymousSignupLogin().subscribe(asl => {
          this.autoLoginSubs = this.authService.autoLogin().subscribe(() => {
            this.activatedRoute.paramMap.subscribe(pMap => {
              if (!pMap.has('departmentId')) {
                this.router.navigateByUrl('/departments');
                return;
              }

              this.departmentID = pMap.get('departmentId');

              this.getDepartmentsSubs = this.departmentService.getDepartments().subscribe(d => {
                if (!d.length) {
                  this.fetchDepartmentsSubs = this.departmentService.fetchDepartments().subscribe(() => {
                    this.getDepartmentSubs = this.departmentService.getDepartment(this.departmentID).subscribe(sd => {
                      this.selectedDepartment = sd;
                    }, err => {
                      this.isLoading = false;
                    });
                  }, err => {
                    this.isLoading = false;
                    this.alertController.create({
                      header: 'Error',
                      message: 'There was an error getting Questions. Please check your internet connection and try again.',
                      buttons: [{
                        text: 'okay', handler: () => {
                          this.router.navigateByUrl('/departments');
                        }
                      }]
                    }).then(alertEl => {
                      alertEl.present();
                    });
                  });
                }
              }, err => {
                this.isLoading = false;
                this.alertController.create({
                  header: 'Error',
                  message: 'There was an error getting Questions. Please check your internet connection and try again.',
                  buttons: [{
                    text: 'okay', handler: () => {
                      this.router.navigateByUrl('/departments');
                    }
                  }]
                }).then(alertEl => {
                  alertEl.present();
                });
              });

              this.getQuestionsSubs = this.questionService.getQuestions().subscribe(q => {
                this.loadedQuestions = q;
              });

              this.fetchedQuestsSubs = this.questionService.fetchQuestion(this.departmentID).subscribe(() => {
                this.isLoading = false;
                this.onShowNextQuestion();
              }, err => {
                this.isLoading = false;
                this.alertController.create({
                  header: 'Error!',
                  message: 'There was an error getting Questions. Please check your internet connection and try again.',
                  buttons: [{
                    text: 'okay', handler: () => {
                      this.router.navigateByUrl('/departments');
                    }
                  }]
                }).then(alertEl => {
                  alertEl.present();
                });
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
          });
        });
      } else {
        this.activatedRoute.paramMap.subscribe(pMap => {
          if (!pMap.has('departmentId')) {
            this.router.navigateByUrl('/departments');
            return;
          }

          this.departmentID = pMap.get('departmentId');

          this.getDepartmentsSubs = this.departmentService.getDepartments().subscribe(d => {
            if (!d.length) {
              this.fetchDepartmentsSubs = this.departmentService.fetchDepartments().subscribe(() => {
                this.getDepartmentSubs = this.departmentService.getDepartment(this.departmentID).subscribe(sd => {
                  this.selectedDepartment = sd;
                });
              }, err => {
                this.alertController.create({
                  header: 'Error',
                  message: 'There was an error getting Questions. Please check your internet connection and try again.',
                  buttons: [{
                    text: 'okay', handler: () => {
                      this.router.navigateByUrl('/departments');
                    }
                  }]
                }).then(alertEl => {
                  alertEl.present();
                });
              });
            }
          });

          this.getQuestionsSubs = this.questionService.getQuestions().subscribe(q => {
            this.loadedQuestions = q;
          });

          this.fetchedQuestsSubs = this.questionService.fetchQuestion(this.departmentID).subscribe(() => {
            this.isLoading = false;
            this.onShowNextQuestion();
          }, err => {
            this.alertController.create({
              header: 'Error!',
              message: 'There was an error getting Questions. Please check your internet connection and try again.',
              buttons: [{
                text: 'okay', handler: () => {
                  this.router.navigateByUrl('/departments');
                }
              }]
            }).then(alertEl => {
              alertEl.present();
            });
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
    });
  }

  ionViewDidLeave() {
    this.questionService.initializeIterator();
  }

  ionViewWillEnter() {
    this.storageService.retrieveItem('departments').then((value) => {
      const deptsString = value.value;
      if (deptsString) {
        const depts = JSON.parse(deptsString);
        if (this.departmentService.isAllDepartmentsComplete(depts)) {
          this.router.navigateByUrl('/departments');
        }
      }
    });
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
    this.selectedOptionLabel = this.loadedQuestions[this.questionIterator].selectedOptionLabel;
    this.currentQuestion = this.loadedQuestions[this.questionIterator];
  }

  onShowNextQuestion() {
    this.questionService.questionIterator++;
    this.questionIterator = this.questionService.questionIterator;
    this.selectedOption = this.loadedQuestions[this.questionIterator]?.selectedOption;
    this.selectedOptionLabel = this.loadedQuestions[this.questionIterator]?.selectedOptionLabel;
    this.currentQuestion = this.loadedQuestions[this.questionIterator];
  }

  onCompleteDepartmentQuestionnaire() {
    const lastQuestion = this.loadedQuestions[this.loadedQuestions.length - 1];
    if (lastQuestion.isTypable) {
      lastQuestion.typableText = this.publicTextArea.value;
    } else {
      lastQuestion.selectedOption = this.currentQuestion.selectedOption;
    }

    const answers = this.questionService.accumulateAnswers(this.loadedQuestions, this.userInfo);

    if (!this.questionService.isAtLeastAResposponseGiven(answers)) {
      this.toastController.create({
        message: 'No response given',
        duration: 2000
      }).then(toastEl => toastEl.present());
      return;
    }

    this.loadingCtrl.create({ message: 'Submitting...' })
      .then(loader => {
        loader.present();

        this.completeQuestsSubs = this.questionService.completeQuestions(answers).subscribe((f) => {

          // Set department to complete
          this.completeDeptSubs = this.departmentService.setDepartmentToComplete(this.selectedDepartment).subscribe();
          this.getDeptsSubs = this.departmentService.getDepartments().subscribe(depts => {
            this.storageService.saveItem('departments', depts);
          });

          loader.dismiss();

          this.departmentService.getDepartments().subscribe(d => {
            let iterator = 0;
            for (const department of d) {
              if (department.isComplete === true) {
                iterator++;
              }
            }

            if (iterator === d.length) {
              this.btnComplete.disabled = true;
              this.router.navigateByUrl('/thankyou');
            } else {
              this.router.navigateByUrl('/departments');
            }
          });

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
            ['okay']
          );
        });
      });
  }

  onOptionSelected(event) {
    this.currentQuestion.selectedOption = event.target.value;
  }

  ngOnDestroy() {
    if (this.isAllDComplteSubs) {
      this.isAllDComplteSubs.unsubscribe();
    }

    if (this.selectedDepartmentSubs) {
      this.selectedDepartmentSubs.unsubscribe();
    }

    if (this.completeDeptSubs) {
      this.completeDeptSubs.unsubscribe();
    }

    if (this.questionIitializationSubs) {
      this.questionIitializationSubs.unsubscribe();
    }

    if (this.fetchedQuestsSubs) {
      this.fetchedQuestsSubs.unsubscribe();
    }

    if (this.getQuestionsSubs) {
      this.getQuestionsSubs.unsubscribe();
    }

    if (this.completeQuestsSubs) {
      this.completeQuestsSubs.unsubscribe();
    }

    if (this.getDeptsSubs) {
      this.getDeptsSubs.unsubscribe();
    }

    if (this.autoLoginSubs) {
      this.autoLoginSubs.unsubscribe();
    }

    if (this.anonymousLoginSubs) {
      this.anonymousLoginSubs.unsubscribe();
    }

    if (this.getDepartmentsSubs) {
      this.getDepartmentsSubs.unsubscribe();
    }

    if (this.fetchDepartmentsSubs) {
      this.fetchDepartmentsSubs.unsubscribe();
    }

    if (this.getDepartmentSubs) {
      this.getDepartmentSubs.unsubscribe();
    }

    if (this.backBtnSubs) {
      this.backBtnSubs.unsubscribe();
    }
  }

}
