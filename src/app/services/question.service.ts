import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, take, map, switchMap } from 'rxjs/operators';
import { BehaviorSubject, of } from 'rxjs';

import { IQuestion } from '../models/questions.model';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { UtilService } from './util.services';
import { StorageService } from './storage.service';

interface IAnswerObj {
    departmentId: string;
    answers: IQuestion[];
    userInfo: string;
}

interface AvailableOptions {
    label: string;
    value: string;
}

@Injectable({ providedIn: 'root' })
export class QuestionService {
    private questions = new BehaviorSubject<IQuestion[]>([]);

    private currentQuestion: IQuestion;
    private answer = {} as IAnswerObj;
    questionIterator = -1;

    constructor(
        private httpClient: HttpClient,
        private authService: AuthService,
        private utilService: UtilService,
        private storageService: StorageService
    ) { }

    initializeIterator() {
        this.questionIterator = -1;
    }

    getQuestions() {
        return this.questions.asObservable();
    }

    fetchQuestion(departmentId: string) {
        const questions = [];
        return this.authService.token.pipe(
            take(1),
            switchMap(token => {
                return this.httpClient.get<IQuestion>(`${environment.databaseURL}/questions.json?orderBy="departmentId"&equalTo="${departmentId}"&auth=${token}`);
            }),
            take(1),
            map(fetchedQuestions => {

                for (const key in fetchedQuestions) {
                    if (fetchedQuestions.hasOwnProperty(key)) {
                        const eachQuestion = {
                            id: key,
                            departmentId: fetchedQuestions[key].departmentId,
                            question: fetchedQuestions[key].question,
                            selectedOption: key,
                            selectedOptionLabel: key,
                            isTypable: fetchedQuestions[key].isTypable,
                            typableText: fetchedQuestions[key].typableText,
                            multipleSelection: fetchedQuestions[key].multipleSelection,
                            options: []
                        } as IQuestion;

                        if (!fetchedQuestions[key].isTypable) {
                            if (fetchedQuestions[key].options.length) {

                            }

                            for (const it of fetchedQuestions[key].options) {
                                eachQuestion.options.push(
                                    {
                                        label: it.value,
                                        value: it.label,
                                        isChecked: false
                                    }
                                );
                            }
                        }
                        questions.push(eachQuestion);
                    }
                }
                return questions.sort((a, b) => {
                    if (a.isTypable < b.isTypable) {
                        return -1;
                    } else {
                        return 1;
                    }
                });
            }),
            tap((quests) => {
                this.questions.next(quests);
            })
        );
    }

    isAtLeastAResposponseGiven(answer: IAnswerObj): boolean {
        const availableOptions = ['A', 'B', 'C', 'D', 'E'];
        let isActedOn = false;

        for (const iterator of answer.answers) {
            if (!iterator.isTypable) {
                if (!iterator.multipleSelection) {
                    isActedOn = availableOptions.includes(iterator.selectedOption);
                } else {
                    for (const j of iterator.options) {
                        if (j.isChecked) {
                            return true;
                        }
                    }
                }
            } else {
                isActedOn = !!iterator.typableText.length;
            }

            if (isActedOn) {
                return isActedOn;
            }
        }
        return isActedOn;
    }

    accumulateAnswers(questions: IQuestion[], userInfo: string): IAnswerObj {
        let selOption = '';
        let selLabel = '';
        const ques = [];
        const answerToBeSentToServer = {};

        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];
            // if (question.selectedOption.toString().split('`').length === 2) {
            //     selOption = this.separateSelectedValue(question.selectedOption.toString(), 0);
            //     selLabel = this.separateSelectedValue(question.selectedOption.toString(), 1);
            // } else {
            selOption = question.selectedOption;
            selLabel = question.selectedOptionLabel;
            // }

            questions[i].selectedOption = selOption;
            questions[i].selectedOptionLabel = selLabel;
            questions[i].id = question.id;
            questions[i].departmentId = question.departmentId;
            questions[i].isTypable = question.isTypable;
            questions[i].typableText = question.typableText;
            questions[i].options = question.options;

            ques.push(questions[i]);
        }

        // get the age and gender of the user
        this.answer = {
            departmentId: questions[0].departmentId,
            answers: ques,
            userInfo: JSON.parse(userInfo)
        };

        return this.answer;
    }

    completeQuestions(questions: IAnswerObj) {
        return this.authService.token.pipe(
            take(1),
            switchMap(token => {
                return this.httpClient.post(`${environment.databaseURL}/answered-questions.json?auth=${token}`,
                    { ...questions });
            }),
            take(1),
            tap(resData => {
                return resData;
            }));
    }

    private separateSelectedValue(val: string, partToTake: number) {
        return val?.split('`')[partToTake];
    }
}
