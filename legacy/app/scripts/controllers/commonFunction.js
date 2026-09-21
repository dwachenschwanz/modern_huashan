var smartorg;
(function (smartorg) {
    var wizard;
    (function (wizard) {
        var ArrayFunctions = (function () {
            function ArrayFunctions() {
            }
            /**
             * Move an element of an array.
             *
             * @param array {Array} Array to handle.
             * @param index {number} Element index.
             * @param step {number} Positive number means move right,
             *     negative move left. For now the abs(step) is always 1.
             */
            ArrayFunctions.moveItem = function (array, index, step) {
                this.swap(array, index, index + step);
            };
            ArrayFunctions.moveItemLeftByOne = function (array, index) {
                if (index > 0 && index < array.length) {
                    ArrayFunctions.moveItem(array, index, -1);
                    return true;
                }
                else {
                    return false;
                }
            };
            ArrayFunctions.moveItemRightByOne = function (array, index) {
                if (index < array.length - 1 && index > -1) {
                    ArrayFunctions.moveItem(array, index, 1);
                    return true;
                }
                else {
                    return false;
                }
            };
            ArrayFunctions.swap = function (array, index1, index2) {
                var temp;
                if (array && array.length > 1 &&
                    index1 >= 0 && index1 < array.length &&
                    index2 >= 0 && index2 < array.length) {
                    temp = array[index1];
                    array[index1] = array[index2];
                    array[index2] = temp;
                    return true;
                }
                else {
                    return false;
                }
            };
            return ArrayFunctions;
        }());
        wizard.ArrayFunctions = ArrayFunctions;
    })(wizard = smartorg.wizard || (smartorg.wizard = {}));
})(smartorg || (smartorg = {}));
//# sourceMappingURL=commonFunction.js.map