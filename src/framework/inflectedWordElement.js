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

import Element from './element';
import WordElement from './wordElement';

import LexicalCategory from '../features/LexicalCategory';

class InflectedWordElement extends Element {

  constructor(word, category){
    super();
    if (word instanceof WordElement && category == undefined){
      this.setFeature('BASE_WORD', word);
      let defaultSpelling = word.getDefaultSpellingVariant();
      this.setFeature('BASE_FORM', defaultSpelling);
      this.setCategory(word.getCategory());
    } else if (typeof word == "string" && category){
      this.setFeature('BASE_FORM', word);
      this.setCategory(category);      
    }
  }

  getChildren(){
    return null;
  }

  toString(){
    return "InflectedWordElement[" + this.getBaseForm() + ':' +  ((this.getCategory() instanceof LexicalCategory) ? this.getCategory().name : this.getCategory()) + ']';
  }

  printTree(indent){
    let print = "InflectedWordElement: base=" + this.getBaseForm();
    print += ", category=" + ((this.getCategory() instanceof LexicalCategory) ? this.getCategory().name : this.getCategory()) + ", " + super.toString() + '\n';
    return print;
  }

  getBaseForm(){
    return this.getFeatureAsString('BASE_FORM');
  }

  setBaseWord(word){
    this.setFeature('BASE_WORD', word);
  }

  getBaseWord(){
    let baseWord = this.getFeatureAsElement('BASE_WORD');
    return (baseWord instanceof WordElement) ? baseWord : null;
  }

}

export default InflectedWordElement;
