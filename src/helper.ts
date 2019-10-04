
export const str_pad = (str: string, length: number, pad_string: string) => {
    const strLength = (str + '').length
    for (let i = 0; i < (length - strLength); i++) {
        str = pad_string + '' + str;
    }
    return str;
}
