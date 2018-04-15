/*
 * The contents of this file are subject to the Mozilla Public License
 * Version 1.1 (the "License"); you may not use this file except in
 * compliance with the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
 * License for the specific language governing rights and limitations
 * under the License.
 *
 * The Original Code is "Simplenlg".
 *
 * The Initial Developer of the Original Code is Ehud Reiter, Albert Gatt and Dave Westwater.
 * Portions created by Ehud Reiter, Albert Gatt and Dave Westwater are Copyright (C) 2010-11 The University of Aberdeen. All Rights Reserved.
 *
 * Contributor(s): Ehud Reiter, Albert Gatt, Dave Wewstwater, Roman Kutlak, Margaret Mitchell.
 */


import S from "String";

const AN_EXCEPTIONS = ["one", "180", "110"];

/*
 * Start of string involving vowels, for use of "an"
 */
const AN_AGREEMENT = new RegExp("^(a|e|i|o|u).*");

class DeterminerAgrHelper {

  static requiresAn(string){
    let req = false;
    let lowercaseInput = string.toLowerCase();
    if (AN_AGREEMENT.test(lowercaseInput) && !DeterminerAgrHelper.isAnException(lowercaseInput)){
      req = true;
    } else {
      let numPref = DeterminerAgrHelper.getNumericPrefix(lowercaseInput);

      if (numPref != null && numPref.length > 0 && /^(8|11|18).*$/.test(numPref)){
        let num = parseInt(numPref);
        req = DeterminerAgrHelper.checkNum(num);
      }
    }

    return req;
  }

  static isAnException(str){
    return AN_EXCEPTIONS.some(function(ex){
      let exp = new RegExp("^" + ex + ".*");
      return exp.test(str);
    });
  }

  /*
   * Retrieve the numeral prefix of a string.
   */
  static getNumericPrefix(string){
    let numeric = "";

    if (string != null) {
      string = string.trim();

      if (string.length > 0){

        let buffer = string;
        let first = buffer.charAt(0);

        if (S(first).isNumeric()){
          numeric += first;

          for (let i = 1; i < buffer.length; i++) {
            let next = buffer.charAt(i);

            if (S(next).isNumeric()) {
              numeric += next;

              // skip commas within numbers
            } else if (next == ',') {
              continue;

            } else {
              break;
            }
          }
        }
      }
    }

    return numeric.length == 0 ? null : numeric;
  }

  /*
   * Returns <code>true</code> if the number starts with 8, 11 or 18 and is
   * either less than 100 or greater than 1000, but excluding 180,000 etc.
   */
  static checkNum(num){
    let needsAn = false;

    // eight, eleven, eighty and eighteen
    if (num == 11 || num == 18 || num == 8 || (num >= 80 && num < 90)) {
      needsAn = true;

    } else if (num > 1000) {
      num = Math.round(num / 1000);
      needsAn = DeterminerAgrHelper.checkNum(num);
    }

    return needsAn;
  }


}

export default DeterminerAgrHelper;