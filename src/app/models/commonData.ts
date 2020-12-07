export class CommonData {
    /////////////////////
    //ag-grid表状态1、通话详单状态 2、对端号码统计状态 3、共同联系人状态

    //话单表前缀
    public static width: number;
    public static height: number;

    /**
     * 当前表名称
    */
    public static currentTable: string;
    /**当前运营商类型 */
    public static CURRENT_MNC;

    /**
     * 当前话单所有通话记录
     */
    public static allRecords: any[];

    /**
     * 当前话单记录的map
     */
    public static allRecordsMap: Map<number, any>;

    /**
     * 所有话单名称
     */
    public static tables: any[];

    /**号码对应的姓名 */
    public static ContactsMap:Map<string,any>;

    /**服務器端操作sql的php網址 */
    public static sqlUrl = '/huadan/sql.php'

    /**号码历史记录 */
    public static recordHistory: Map<number, any>;

    /**保存可能的表格列定义的字段，从本地assets/fields.json获取后转为map */
    public static fieldsMap;

}
