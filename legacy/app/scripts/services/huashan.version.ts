angular.module('huashanApp')
    .service('Version', function () {
    return new Version();
});

class Version{
    constructor(){}
    getVersion(){
        return [
            {
                versionNo:"0.9.1",
                ChangeLog:[
                    'Fix log in timeout',
                    'Add Synctemplate'
                ]
            },
            {
                versionNo:"0.9.0",
                ChangeLog:[
                    'Switch to Python 3.7',
                    'Fix SmartOrgrify'
                ]
            },
            {
                versionNo:"0.8.2",
                ChangeLog:[
                    'Template version supports revisions comparision',
                    'Integrate new SmartOrgrify',
                    'Integrate Kirk Api into Wizard'
                ]
            },
            {
                versionNo:"0.8.1",
                ChangeLog:[
                    'Template version: View revision details and switch revision and download excel model'
                ]
            },
            {
                versionNo:"0.8.0",
                ChangeLog:[
                    'Template version: save and show revision list'
                ]
            },
            {
                versionNo:"0.7.9",
                ChangeLog:[
                    'Impletemented Pnl in Table command',
                    'Impletemented Pnl in Add_Tables'
                ]
            },
            {
                versionNo:"0.7.8",
                ChangeLog:[
                    'Metalog supports Mean, Variance and Skewness',
                    'Support Portfolio Uncertainty Command',
                    'Excel upload bug fixed'
                ]
            },
            {
                versionNo:"0.7.7",
                ChangeLog:[
                    'Included table inputs will not show in Input in Data Structure and Display binding fixed',
                    'Portfolio and App Structure ID should not contain "/" fixed',
                    'Table Inputs JSON format fixed',
                    'Table Inputs UI wasted white space removed and text fixed',
                    'Table Inputs timeout and Spinner fixed',
                    'Table Inputs multiple bugs fixed'
                ]
            },
            {
                versionNo:"0.7.6",
                ChangeLog:[
                    'Portfolio commands should not show up in Appstructure' +
                    ' fixed',
                    'Layout of potential table inputs changed',
                    'Login password or username warning style changed',
                    'Wizard generages same ID bug fixed',
                    'Compare_Value in Platform App Structure bug fixed',
                    'Unable to add commands to portfolio bug fixed',
                    'Added Result removed when upload a new template',
                    'Excluded inputs list incorrect bug fixed',
                    'Table inputs in Data Structure layout fixed',
                    'Table inputs bug fixed',
                    'Wrong JSON format in Table inputs bug fixed',
                    'Template upload window fixed'

                ]
            },
            {
                versionNo:"0.7.5",
                ChangeLog:[
                    'Wizard will show loading spinner in datastructure'
                ]
            },
            {
                versionNo:"0.7.4",
                ChangeLog:[
                    'Wizard will give proper error message if login fails',
                    'Wizard only allow admin user to login otherwise will show proper message',
                    'Support Potential Table Inputs In Data Structure'
                ]
            },
            {
                versionNo:"0.7.3",
                ChangeLog:[
                    'All the project portfolio level actions are available at Platform app structure level',
                    'Be able to configure DATE in Data Structure Input',
                    'Missing minus square icon in Data Structure fixed'
                ]
            },
            {
                versionNo:"0.7.2",
                ChangeLog:[
                    'Support METALOG_DISPLAY command',
                    'Add Platform Button broken fixed',
                    'Metalog does not work for the key at first time fixed'
                ]
            },
            {
                versionNo:"0.7.1",
                ChangeLog:[
                    'XLSX and XLSM files can now be uploaded and downloaded'
                ]
            },
            {
                versionNo:"0.7.0",
                ChangeLog:[
                    'Input Screen bug for first time templates fixed'
                ]
            },
            {
                versionNo:"0.6.9",
                ChangeLog:[
                    'Unique IDs generated for each action menu item',
                    'Compare Value should have Total parameter',
                    'Drag-n-drop Reordering of options in App Structure and Portfolio Structure'
                ]
            },
            {
                versionNo:"0.6.8",
                ChangeLog:[
                    'Tornado weights bug fixed, now weights are correctly added'
                ]
            },
            {
                versionNo:"0.6.7",
                ChangeLog:[
                    'Check for Med probability being lower than High or Low probability added'
                ]
            },
            {
                versionNo:"0.6.6",
                ChangeLog:[
                    'Update Data Structure functionality added'
                ]
            },
            {
                versionNo:"0.6.5",
                ChangeLog:[
                    'Image menu id bug for quoted sheet names fixed',
                    'Files with underscores can no longer be updated'
                ]
            },
            {
                versionNo:"0.6.4",
                ChangeLog:[
                    'Downloading of Excel model now supported'
                ]
            },
            {
                versionNo:"0.6.3",
                ChangeLog:[
                    'Corrected Upload tooltip'
                ]
            },
            {
                versionNo:"0.6.2",
                ChangeLog:[
                    'Tornado depth bug fixed'
                ]
            },
            {
                versionNo:"0.6.1",
                ChangeLog:[
                    'All tests now pass'
                ]
            },
            {
                versionNo:"0.6.0",
                ChangeLog:[
                    'SmartOgrifier added for easier dataStructure entry',
                    'SmartOgrifier also does basic appStructure'
                ]
            },
            {
                versionNo:"0.5.0",
                ChangeLog:[
                    'fix ADD_TABLES min/max problem',
                    'fixed tornado diagram missing output problem',
                    'added key-editing boxes to data structure',
                    'added Visible to all app structure menu items',
                    'added template name to each page'
                ]
            }
        ];
    }
}
