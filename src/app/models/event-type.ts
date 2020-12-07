export class EventType {

    /**显示基站 带station数组 */
    public static SHOW_STATIONS: string = "showStations";

    /**开关中间表格，可带数字参数，1表示表格宽度不变，其他数字表示表格宽度调整为该数字*/
    public static TOGGLE_MIDDLE: string = "openMiddle";

    /** 打开地图区域 无参数 */
    public static OPEN_RIGHT: string = "openRight";

    /** 打开菜单区域 boolean参数 */
    public static TOGGLE_LEFT: string = "toggleLeft";


    public static IS_CAN_TOGGLE_MIDDLE: string = "isToggleMiddle";

    /** 显示对端号码统计信息 带表格数据参数*/
    public static SHOW_RECORD_COUNT: string = "showRecordCount";

    //显示通话记录
    public static SHOW_RECORDS: string = "showRecords";
    //显示共同联系人
    public static SHOW_COMMON_CONTACTS: string = "showCommonContacts";

    /**库中搜索号码 带号码参数 */
    public static SEARCH_NUMBER: string = "searchNumber";

    public static SHOW_STATIONS_RECORDS: string = "showStationRecords";
    
    public static REFRESH_TABLE: string = "refreshTable";
    public static CLEAR_GRID_DATA: string = 'clearGridData';
    public static CLEAR_MARKER: string = "clearMarker";
    public static SHOW_COMMON_CONTACTS_UI: string = "showCommonContactsUI";

    //是否显示busy图标
    public static IS_SHOW_BUSY_ICON: string = "isShowLoader";
    static SHOW_SEARCH_RECORDS: string = 'showSearchRecords';

    //设置lac ci的经纬度，带{lac:lac,ci:ci}
    public static SET_LBS_LOCATION:string = 'setLbsLocation';

    public static SET_CURSOR:string = "setCursor";
    
}
