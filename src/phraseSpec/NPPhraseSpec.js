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

class NPPhraseSpec extends PhraseElement {
  constructor(that) {
    super('NOUN_PHRASE');
    this.factory = that;
  }

  getFactory(){
    return this.factory;
  }

  setSpecifier(specifier){

    if (specifier instanceof Element){
      this.setFeature('SPECIFIER', specifier);
      specifier.setFeature('DISCOURSE_FUNCTION','SPECIFIER');
    } else {
      // create specifier as word (assume determiner)
      let specifierElement = this.getFactory().createWord(specifier, 'DETERMINER');
      // set specifier feature
      if (specifierElement != null) {
        this.setFeature('SPECIFIER', specifierElement);
        specifierElement.setFeature('DISCOURSE_FUNCTION', 'SPECIFIER');
      }
    }
  }

  setHead(newHead){
    super.setHead(newHead);
    this.setNounPhraseFeatures(this.getFeatureAsElement('HEAD'));
  }

  setNounPhraseFeatures(nounElement){
    if (nounElement == null)
      return;

    this.setFeature('POSSESSIVE', (nounElement != null) ? nounElement.getFeatureAsBoolean('POSSESSIVE') : false);

    this.setFeature('RAISED', false);
    this.setFeature('ACRONYM', false);

    if (nounElement != null && nounElement.hasFeature('NUMBER')){
      this.setFeature('NUMBER', nounElement.getFeature('NUMBER'));
    } else {
      this.setPlural(false);
    }

    if (nounElement != null && nounElement.hasFeature('PERSON')){
      this.setFeature('PERSON', nounElement.getFeature('PERSON'));
    } else {
      this.setFeature('PERSON', 'THIRD');
    }

    if (nounElement != null && nounElement.hasFeature('GENDER')){
      this.setFeature('GENDER', nounElement.getFeature('GENDER'));
    } else {
      this.setFeature('GENDER', 'NEUTER');
    }

    if (nounElement != null && nounElement.hasFeature('EXPLETIVE_SUBJECT')){
      this.setFeature('EXPLETIVE_SUBJECT', nounElement.getFeature('EXPLETIVE_SUBJECT'));
    }

    this.setFeature('ADJECTIVE_ORDERING', true);
  }
}

export default NPPhraseSpec;