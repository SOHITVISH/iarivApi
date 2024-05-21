


const getisotime = (obj:any) => {

    try {
        return obj.now().toUTC().toISO()

    } catch (error) {
        console.log(error);
    }
}

export const getisotimeduration = (obj: { now: () => any; }) => {
    let dateobj:any = {}
    let dobj = obj.now()
    try {
        dateobj["start"] = dobj.toUTC().toISO()
        dateobj["end"] = dobj.toUTC().plus({ days: 7 }).toISO()
        return dateobj
    } catch (error) {
        console.log(error);
    }
}

export default getisotime