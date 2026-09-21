declare var unescape;

var _ute = null;
// JDH: I don't understand what "TheUte" is. Terrible name.
function TheUte()
{
    if(_ute == null)
        _ute = new utils();

    return _ute;
}

	// JDH: Normalize linebreaks across this code.

	function utils()
	{

	    this.removeChildren = removeChildrenElements;
	    this.hasChildren = hasChildrenElements;
        this.isAnum = function(n:any){
            //http://stackoverflow.com/questions/18082/validate-numbers-in-javascript-isnumeric

             return (n - 0) == n && (n+'').replace(/^\s+|\s+$/g, "").length > 0;
        };

		this.pack = function(what: any):string{

			return this.URLEncode(this.encode64(what));

		};

	    this.unravel = function(what)
	    {
  			return this.decode64(this.URLDecode(what));

	    };


	    this.getTimestamp = function()
	    {
	    	var d=new Date();
	    	return d;

	    };



	    var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
		this.keyStr = _keyStr;
		this.encode64 = encode64;
		this.decode64 = decode64;

		this.padNum = function(num,numPlaces)
		{


		    var newNum = 100 + num;
		    var paddedNum = newNum + "";
		    var partialNum = paddedNum.substring(paddedNum.length-2,3);
		    return partialNum;

		}



		this.URLEncode = URLEncoder;
		this.URLDecode = URLDecoder;


}




// JDH: Why do you need these? Does escape work?

// ====================================================================
//       URLEncode and URLDecode functions
//
// Copyright Albion Research Ltd. 2002
// http://www.albionresearch.com/
//
// You may copy these functions providing that
// (a) you leave this copyright notice intact, and
// (b) if you use these functions on a publicly accessible
//     web site you include a credit somewhere on the web site
//     with a link back to http://www.albionresarch.com/
//
// If you find or fix any bugs, please let us know at albionresearch.com
//
// SpecialThanks to Neelesh Thakur for being the first to
// report a bug in URLDecode() - now fixed 2003-02-19.
// ====================================================================
function URLEncoder( plaintext )
{
	// The Javascript escape and unescape functions do not correspond
	// with what browsers actually do...
	var SAFECHARS = "0123456789" +					// Numeric
					"ABCDEFGHIJKLMNOPQRSTUVWXYZ" +	// Alphabetic
					"abcdefghijklmnopqrstuvwxyz" +
					"-_.!~*'()";					// RFC2396 Mark characters
	var HEX = "0123456789ABCDEF";

	//var plaintext = document.URLForm.F1.value;
	var encoded = "";
	for (var i = 0; i < plaintext.length; i++ ) {
		var ch = plaintext.charAt(i);
	    if (ch == " ") {
		    encoded += "+";				// x-www-urlencoded, rather than %20
		} else if (SAFECHARS.indexOf(ch) != -1) {
		    encoded += ch;
		} else {
		    var charCode = ch.charCodeAt(0);
			if (charCode > 255) {
				// JDH: Should be a console log.
			    alert( "Unicode Character '"
                        + ch
                        + "' cannot be encoded using standard URL encoding.\n" +
				          "(URL encoding only supports 8-bit characters.)\n" +
						  "A space (+) will be substituted." );
				encoded += "+";
			} else {
				encoded += "%";
				encoded += HEX.charAt((charCode >> 4) & 0xF);
				encoded += HEX.charAt(charCode & 0xF);
			}
		}
	} // for

	return encoded;
}

function URLDecoder( encString )
{
   // Replace + with ' '
   // Replace %xx with equivalent character
   // Put [ERROR] in output if %xx is invalid.

   var HEXCHARS = "0123456789ABCDEFabcdef";

   var plaintext = "";
   try {

   		if( encString )
	   	{
		   var i = 0;
		   while (i < encString.length) {

		       var ch = encString.charAt(i);
			   if (ch == "+") {
			       plaintext += " ";
				   i++;
			   } else if (ch == "%") {
					if (i < (encString.length-2)
							&& HEXCHARS.indexOf(encString.charAt(i+1)) != -1
							&& HEXCHARS.indexOf(encString.charAt(i+2)) != -1 ) {
						plaintext += unescape( encString.substr(i,3) );
						i += 3;
					} else {
						alert( 'Bad escape combination near ...' + encString.substr(i) );
						plaintext += "%[ERROR]";
						i++;
					}
				} else {
				   plaintext += ch;
				   i++;
				}
			} // while
		} else {
			console.warn("Passed in undefined enc string")
		}

	} catch (urldex) {

		console.error( urldex );
	}
   return plaintext;
}

function encode64(input) {
// Base64 code from Tyler Akins -- http://rumkin.com
   var output = "";

  // if(input == "") return "";

   var lsKeyStr = this.keyStr;
   var chr1, chr2, chr3;
   var enc1, enc2, enc3, enc4;
   var i = 0;

   do {
      chr1 = input.charCodeAt(i++);
      chr2 = input.charCodeAt(i++);
      chr3 = input.charCodeAt(i++);

      enc1 = chr1 >> 2;
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
      enc4 = chr3 & 63;

      if (isNaN(chr2)) {
         enc3 = enc4 = 64;
      } else if (isNaN(chr3)) {
         enc4 = 64;
      }

      output = output + lsKeyStr.charAt(enc1) + lsKeyStr.charAt(enc2) +
         lsKeyStr.charAt(enc3) + lsKeyStr.charAt(enc4);
   } while (i < input.length);


  // alert(input + " converted to " + output);

   return output;
}

function decode64(input) {
   var output = "";

 //  if(input == "") return "";

   var lsKeyStr = this.keyStr;
   var chr1, chr2, chr3;
   var enc1, enc2, enc3, enc4;
   var i = 0;

   // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
   input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

   do {
      enc1 = lsKeyStr.indexOf(input.charAt(i++));
      enc2 = lsKeyStr.indexOf(input.charAt(i++));
      enc3 = lsKeyStr.indexOf(input.charAt(i++));
      enc4 = lsKeyStr.indexOf(input.charAt(i++));

      chr1 = (enc1 << 2) | (enc2 >> 4);
      chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      chr3 = ((enc3 & 3) << 6) | enc4;

      output = output + String.fromCharCode(chr1);

      if (enc3 != 64) {
         output = output + String.fromCharCode(chr2);
      }
      if (enc4 != 64) {
         output = output + String.fromCharCode(chr3);
      }
   } while (i < input.length);

   return output;
}
function removeChildrenElements(parentElem)
{

    var i = 0;

    if(document.all)
    {
        var currentLength = parentElem.children.length;

        for (i=0; i<currentLength; i++)
	    {
		    parentElem.removeChild( parentElem.children[0] );
	    }
	}
	else
	{
	  for (i=0;i<parentElem.childNodes.length;i++)
	  {
            parentElem.removeChild(parentElem.childNodes[i] );
      }

	}
}
function hasChildrenElements(parentElem)
{
	// JDH: Could be simplified with ternary.
	// return ( document.all ? parentElem.children.length : parentElem.childNodes.length ) > 0;
    var currentLength = 0;
    if(document.all)
    {
        currentLength= parentElem.children.length;
	}
	else
	{
	    currentLength = parentElem.childNodes.length;

	}

	if (currentLength == 0)
	    return false;
	else
	    return true;

}