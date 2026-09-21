huashan
=======

Wizard v2

SmartOrgDevelopment

Steps:
- npm install 
if bower gives registry error, put the below in .bowerrc
{
  "directory": "app/bower_components",
  "strict-ssl": false
}
- Server URLs can be changed in app.ts and hushan.service.ts
Below steps are not necessary anymore
- There are three methods in SelectTemplateController.ts which target wizard-api/wizard/etc
  For development, change it to just wizard/etc
  For Deployment, change it to wizard-api/wizard/etc
  