import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, take, map } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';

import { IQuestion } from '../models/questions.model';

interface IAnswerObj {
    departmentId: string;
    answers: string;
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

    constructor(private httpClient: HttpClient) { }

    initializeIterator() {
        this.questionIterator = -1;
    }

    getQuestions() {
        return this.questions.asObservable();
    }

    fetchQuestion(departmentId: string) {
        const questions = [];
        return this.httpClient.get<IQuestion>(`https://absh-questionnaire.firebaseio.com/questions.json?orderBy="departmentId"&equalTo="${departmentId}"`).pipe(
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
                return questions;
            }),
            tap((quests) => {
                this.questions.next(quests);
            })
        );
    }

    accumulateAnswers(question: IQuestion[]): IAnswerObj {
        let obj = '';
        let selOption = '';
        let selLabel = '';
        let stringifiedOptions = '';

        for (const i of question) {
            if (i.selectedOption.toString().split('`').length === 2) {
                selOption = this.separateSelectedValue(i.selectedOption.toString(), 0);
                selLabel = this.separateSelectedValue(i.selectedOption.toString(), 1);
            } else {
                selOption = i.selectedOption;
                selLabel = i.selectedOptionLabel;
            }
            stringifiedOptions = this.stringifyAvailableOptons(i.options);

            obj +=
            `{"availableOptions":"${stringifiedOptions}","opinion":"${i.typableText}","quesId":"${i.id}","selectedOption":"${selOption}","selectedOptionLabel":"${selLabel}","isTypable":"${i.isTypable}","departmentId":"${i.departmentId}"},`;
        }

        let arrayLisedObj = '[';
        arrayLisedObj += obj.substring(0, obj.length - 1);
        arrayLisedObj += ']';
        // arrayLisedObj = arrayLisedObj.replace(/(\n|\r|\s)/gi, '');
        console.log(JSON.parse(arrayLisedObj));
        this.answer = {
            departmentId: question[0].departmentId,
            answers: arrayLisedObj
        };
        return this.answer;
    }

    completeQuestions(questions: IAnswerObj) {
        return this.httpClient.post('https://absh-questionnaire.firebaseio.com/answered-questions.json', { ...questions })
            .pipe(tap(resData => {
                return resData;
            }));
    }

    private stringifyAvailableOptons(options: AvailableOptions[]) {
        if (!options.length) {
            return '[]';
        }

        let stringifiedOptions = '[';
        for (const option of options) {
            stringifiedOptions += `{'label':'${option.label}','option':'${option.value}'},`;
        }
        stringifiedOptions = stringifiedOptions.substring(0, stringifiedOptions.length - 1);
        return stringifiedOptions += ']';
    }

    private separateSelectedValue(val: string, partToTake: number) {
        return val?.split('`')[partToTake];
    }
}
