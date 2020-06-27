export interface IQuestion {
    id: string;
    departmentId: string;
    question: string;
    selectedOption: string;
    options: any;
    isTypable: boolean;
    typableText: string;
}
