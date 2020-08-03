export interface IQuestion {
    id: string;
    departmentId: string;
    question: string;
    selectedOption: string;
    selectedOptionLabel: string;
    options: {label: string; value: string; isChecked: boolean} [];
    isTypable: boolean;
    typableText: string;
    multipleSelection: boolean;
}
