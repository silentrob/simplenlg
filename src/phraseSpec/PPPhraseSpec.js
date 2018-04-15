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


import PhraseElement from '../framework/phraseElement';
import Element from '../framework/element';

class PPPhraseSpec extends PhraseElement {
  constructor(phraseFactory){
    super('PREPOSITIONAL_PHRASE');
    this.factory = phraseFactory;
  }

  setPreposition(preposition) {
    if (preposition instanceof Element){
      this.setHead(preposition);
    } else {
      let prepositionalElement = this.getFactory().createWord(preposition, 'PREPOSITION');
      this.setHead(prepositionalElement);
    }
  }

  getPreposition(){
    return this.getHead();
  }
  
  setObject(object){
    let objectPhrase = this.getFactory().createNounPhrase(object);
    objectPhrase.setFeature('DISCOURSE_FUNCTION', 'OBJECT');
    this.addComplement(objectPhrase);
  }
  
  getObject(){
    let complements = this.getFeatureAsElementList('COMPLEMENTS');
    for (let i = 0; i < complements.length; i++){
      let complement = complements[i];
      if (complement.getFeature('DISCOURSE_FUNCTION') == 'OBJECT'){
        return complement;
      }
    }
    return null;
  }
  
}

export default PPPhraseSpec;