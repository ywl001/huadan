export class Model {
    //////////////////////////列标题////////////////////////

    /**
     * 联通、移动、电信4G列标题基站代码
     */
    public static LAC_CN: string = '基站代码';

    public static LAC: string = "lac"

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
     * cdma话单中的蜂窝号
     */
    public static CDMA_CI: string = '蜂窝号';

    /**
     * cdma的sid
     */
    public static CDMA_SID: string = 'sid';

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

    /////////////////////
    //ag-grid表状态1、通话详单状态 2、对端号码统计状态 3、共同联系人状态

    //话单表前缀
    public static width: number;
    public static height: number;

    /**
     * 当前表名称
    */
    public static currentTable: string;
    public static CURRENT_MNC;

    /**
     * 基站数量的统计信息,当点击话单的时候获取{lac,ci,count}
     */
    public static stationsCountList: any[];

    /**
     * 当前话单所有通话记录
     */
    public static allRecords: any[];

    /**
     * 当前话单记录的map
     */
    public static allRecordsMap: Map<number, any>;

    /**
     * 对端号码统计信息
     */
    public static recordsCountList: any[];

    /**
     * 所有话单名称
     */
    public static tables: any[];

    /**
     * 是否显示返回按钮，用于返回话单统计和共同联系人
     */
    public static isShowBtnBack: boolean;

    /**
     * 共同联系人数据
     */
    public static commonContactsList: any[];

    /**号码对应的姓名 */
    public static ContactsMap;


    public static sqlUrl = '/huadan/sql.php'

    /**号码历史记录 */
    public static recordHistory: Map<number, any>;

    /**保存可能的表格列定义的字段，从本地assets/fields.json获取后转为map */
    public static fieldsMap;

    /**号码对应的机主信息 */
    public static CONTACT: string = 'contact'
    public static INSERT_TIME: string = 'insertTime'

    ///////////////////////////////鼠标的光标/////////////////////////
    //十字光标
    public static CURSOR_CROSSHAIR = "crosshair";

    //链接光标
    public static CURSOR_POINTER = "pointer";

    //箭头光标
    public static CURSOR_DEFAULT = "default";

    //默认光标
    public static CURSOR_AUTO = "auto";


}
