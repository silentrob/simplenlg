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

class AdvPhraseSpec extends PhraseElement {
  constructor(phraseFactory){
    super('ADVERB_PHRASE');
    this.factory = phraseFactory;
  }

  setAdverb(adverb){
    if (adverb instanceof Element){
      this.setHead(adverb);
    } else {
      let adverbElement = this.getFactory().createWord(adverb, 'ADVERB');
      this.setHead(adverbElement);
    }
  }

  getAdverb(){
    return this.getHead();
  }
}

export default AdvPhraseSpec;