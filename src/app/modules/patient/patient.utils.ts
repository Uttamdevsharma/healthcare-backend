import { isValid } from "date-fns";

export const convertToDateTime = (dateString: string | undefined) => {
    if(!dateString) return undefined;

    const date = new Date(dateString);

    if(!isValid(date)) return undefined;

    return date;
}