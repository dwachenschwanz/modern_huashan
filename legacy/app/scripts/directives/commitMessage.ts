
angular.module(
    'smartorg.wizard.commitMessage', []
).directive('commitMessageModal', [ () => ({
    template: `
<div class="modal fade" id="commitMessageModal" tabindex="-1" role="dialog"
     aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal"><span
            aria-hidden="true">&times;</span><span
            class="sr-only">Close</span></button>
        <h4 class="modal-title">Change Message</h4>

      </div>
      <div class="modal-body">
        <h4>You will see this message in the revisions page</h4>
        <textarea type="text" ng-model="commitMessage" class="form form-control"
                  id="commit-display"></textarea>
      </div>

      <div class="modal-footer">
        <button class="btn btn-primary"
                ng-click="saveFunction({commitMessage: commitMessage})">Ok
        </button>
        <!--<button class= "btn btn-warning" ng-click="uploads.cancel()">Cancel</button>-->
        <button type="button" class="btn btn-default" data-dismiss="modal">
          Cancel
        </button>
      </div>
    </div>
  </div>
</div>
    `,
    restrict: 'E',
    scope: {
        saveFunction: '&'
    },
    link: (scope) => {

    }
})]);