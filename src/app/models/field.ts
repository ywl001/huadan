export class Field {
    /**
     * 联通、移动、电信4G列标题基站代码
     */
    public static LAC_CN: string = '基站代码';
    public static LAC: string = "lac";

    /**
     * 联通、移动、电信4G列标题小区ID
     */
    public static CI_CN: string = '小区ID';
    public static CI: string = 'ci';

    /**运营商标识码 */
    public static MNC = 'mnc';
    /**
     * cdma话单中的通话地
     */
    public static CDMA_CITY: string = '通话地';
    /**
     * 列标题对端号码
     */
    public static OTHER_NUMBER_CN: string = "对端号码";
    public static OTHER_NUMBER: string = "otherNumber"

    /**
     * 列标题起始时间
     */
    public static START_TIME_CN: string = "起始时间";
    public static START_TIME: string = "startTime";

    /**
     * 列标题通话时长
     */
    public static DURATION_CN: string = "通话时长";
    public static DURATION: string = "callDuration";

    /**
     * 列标题通话类型
     */
    public static CALL_TYPE_CN: string = "通话类型";
    public static CALL_TYPE: string = "callType";

    /**
    * 列标题通话类型
    */
    public static TABLE_NAME: string = "话单名称";

    /**
     * 列标题lat
     */
    public static LAT: string = 'lat';

    /**
     * 列标题lng
     */
    public static LNG: string = 'lng';

    /**
     * 列标题addr基站地址描述
     */
    public static ADDR: string = 'addr';

    /**
    * 列标题acc基站覆盖半径
    */
    public static ACC: string = 'acc';

    //通话统计
    public static COUNT_CALL: string = "通话次数";
    public static TOTAL_TIME: string = "总时长";
    //共同联系人
    public static COUNT_TABLE: string = "数量";

    /**号码对应的机主信息 */
    public static CONTACT: string = 'contact'
    public static INSERT_TIME: string = 'insertTime'
}
