import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, take, map } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';

import { IQuestion } from '../models/questions.model';
import { IAnswer } from '../models/answer.model';

@Injectable({ providedIn: 'root' })
export class QuestionService {
    private questions = new BehaviorSubject<IQuestion[]>([
        // {
        //     id: 'q1',
        //     departmentId: 'd1',
        //     question: 'Was the lab attendant compassionate and helpful?',
        //     selectedOption: 'q1',
        //     options: [
        //         { label: 'option1', value: 'A', isChecked: false },
        //         { label: 'option2', value: 'B', isChecked: false },
        //         { label: 'option3', value: 'C', isChecked: false },
        //         { label: 'option4', value: 'd', isChecked: false },
        //     ],
        //     isTypable: false,
        //     typableText: ''
        // },
        // {
        //     id: 'q2',
        //     departmentId: 'd1',
        //     question: 'This is question 2',
        //     selectedOption: 'q2',
        //     options: [
        //         { label: 'option1', value: 'A', isChecked: false },
        //         { label: 'option2', value: 'B', isChecked: false },
        //         { label: 'option3', value: 'C', isChecked: false },
        //         { label: 'option4', value: 'd', isChecked: false },
        //     ],
        //     isTypable: false,
        //     typableText: ''
        // },
        // {
        //     id: 'q3',
        //     departmentId: 'd1',
        //     question: 'This is question 3',
        //     selectedOption: 'q2',
        //     options: [
        //         { label: 'option1', value: 'A', isChecked: false },
        //         { label: 'option2', value: 'B', isChecked: false },
        //         { label: 'option3', value: 'C', isChecked: false },
        //         { label: 'option4', value: 'd', isChecked: false },
        //     ],
        //     isTypable: false,
        //     typableText: ''
        // },
        // {
        //     id: 'q4',
        //     departmentId: 'd1',
        //     question: 'This is question 4',
        //     selectedOption: 'q4',
        //     options: [
        //         { label: 'option1', value: 'A', isChecked: false },
        //         { label: 'option2', value: 'B', isChecked: false },
        //         { label: 'option3', value: 'C', isChecked: false },
        //         { label: 'option4', value: 'd', isChecked: false },
        //     ],
        //     isTypable: false,
        //     typableText: ''
        // },
        // {
        //     id: 'q5',
        //     departmentId: 'd1',
        //     question: 'This is question 5',
        //     selectedOption: 'q5',
        //     options: [],
        //     isTypable: true,
        //     typableText: ''
        // }
    ]);

    private currentQuestion: IQuestion;
    private answers = {} as IAnswer;
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

    // renderPreviousQuestion() {
    //     this.questionIterator--;

    //     if (this.questionIterator < 0) {
    //         this.questionIterator = 0;
    //     }

    //     this.currentQuestion = this.questions[this.questionIterator];
    //     return this.currentQuestion;
    // }

    // renderNextQuestion() {
    //     this.questionIterator++;
    //     return this.getQuestions().pipe(
    //         take(1),
    //         map(quests => {
    //             if (this.questionIterator > quests.length) {
    //                 return undefined;
    //             }

    //             this.currentQuestion = quests[this.questionIterator];
    //             return this.currentQuestion;
    //         })
    //     );
    // }

    accumulateAnswers(question: IQuestion[]): IAnswer {
        for (const i of question) {
            this.answers[`${i.id}`] = {
                opinion: i.typableText,
                quesId: i.id,
                selectedOption: i.selectedOption,
                isTypable: i.isTypable
            };
        }
        return this.answers;
    }

    completeQuestions(questions: IAnswer) {
        return this.httpClient.post('https://absh-questionnaire.firebaseio.com/answered-questions.json', { ...questions })
            .pipe(tap(resData => {
                return resData;
            }));
    }
}
