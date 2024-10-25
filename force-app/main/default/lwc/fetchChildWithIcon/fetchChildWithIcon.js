import { LightningElement,api,track,wire } from 'lwc';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import PARENT_OBJECT from '@salesforce/schema/Account';
import CHILD_OBJECT from '@salesforce/schema/Contact';
// expose an api to take object api name and then fetch the object info

export default class FetchChildWithIcon extends LightningElement {

    @api recordId='0015j00000cdYijAAE'; // Parent record ID
    @api flexipageRegionWidth
    @track childRecords = [];
    parentIcon;
    parentColor;
    childIcon;
    childColor;

    parentApiName = PARENT_OBJECT.objectApiName;
    childApiName = CHILD_OBJECT.objectApiName;

    @wire(getObjectInfo,{objectApiName: PARENT_OBJECT})
    parentObjectInfo({ error, data }){
        if (data) {
            this.parentIcon = data.themeInfo.iconUrl; // Set the icon name dynamically
            this.parentColor = `#${data.themeInfo.color}`;
            //console.log('Parent object info :'+JSON.stringify(data));
            console.log('Parent icon :'+this.parentIcon);
            console.log('Parent icon color:'+this.parentColor);

        } else if (error) {
            console.error(error);
        }
    }
    
    @wire(getObjectInfo, { objectApiName: CHILD_OBJECT })
    choldObjectInfo({ error, data }) {
        if (data) {
            this.childIcon = data.themeInfo.iconUrl; // Set the icon name dynamically
            this.childColor = `#${data.themeInfo.color}`;

            //console.log('Child object info :'+JSON.stringify(data));
            console.log('Child icon :'+this.childIcon);
            console.log('Child icon color:'+this.childColor);

        } else if (error) {
            console.error(error);
        }
    }

    get iconParentStyle() {
        return `background-color: ${this.parentColor};`;
    }


    get iconChildStyle() {
        return `background-color: ${this.childColor};`;
    }
}
