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


import NounPhraseHelper from './NounPhraseHelper';
import PhraseHelper from './PhraseHelper';
import VerbPhraseHelper from './VerbPhraseHelper';
import CoordinatedPhraseHelper from './CoordinatedPhraseHelper';

import NLGModule from '../framework/nlgmodule';
import PhraseElement from '../framework/phraseElement';
import DocumentElement from '../framework/documentElement';
import ListElement from '../framework/listElement';
import CoordinatedPhraseElement from '../framework/coordinatedPhraseElement';
import WordElement from '../framework/wordElement';

import InflectedWordElement from '../framework/inflectedWordElement';

import ClauseHelper from './clauseHelper'

class SyntaxProcessor extends NLGModule {
  constructor(){
    super();
  }

  realise(element){

    if (element instanceof Array){

      let realisedList = [];
      let childRealisation = null;

      if (element != null) {
        for (let i = 0; i < element.length; i++){
          let eachElement = element[i];
          if (eachElement != null) {
            childRealisation = this.realise(eachElement);
            if (childRealisation != null){
              if (childRealisation instanceof ListElement) {
                realisedList.push(...childRealisation.getChildren());
              } else {
                realisedList.push(childRealisation);
              }
            }
          }
        }
      }
      return realisedList;
    }

    let realisedElement = null;

    if (element != null && !element.getFeatureAsBoolean('ELIDED')){

      if (element instanceof DocumentElement) {
        let children = element.getChildren();
        element.setComponents(this.realise(children));
        realisedElement = element;
      } else if (element instanceof PhraseElement) {
        realisedElement = this.realisePhraseElement(element);
      } else if (element instanceof InflectedWordElement){
        let baseForm = element.getBaseForm();
        let category = element.getCategory();

        if (this.lexicon != null && baseForm != null){
          let word = element.getBaseWord();
          
          if (word == null) {
            if (category) {
              word = this.lexicon.lookupWord(baseForm, category);
            } else {
              word = this.lexicon.lookupWord(baseForm);
            }
          }

          if (word != null) {
            element.setBaseWord(word);           
          }
        }

        realisedElement = element;

      } else if (element instanceof WordElement) {
        let infl = new InflectedWordElement(element);
        for (let feature in element.getAllFeatures()){
          infl.setFeature(feature, element.getAllFeatures()[feature]);
        }
        realisedElement = this.realise(infl);
      } else if (element instanceof CoordinatedPhraseElement){
        realisedElement = CoordinatedPhraseHelper.realise(this, element);
      } else {
        realisedElement = element;
      }
    }

    // Remove the spurious ListElements that have only one element.
    if (realisedElement instanceof ListElement){
      if (realisedElement.length === 1) {
        realisedElement = realisedElement.getFirst();
      }
    }

    return realisedElement;
  }

  realisePhraseElement(phrase){
      let realisedElement = null;

      if (phrase != null) {
        let category = phrase.getCategory();

        switch (category) {

          case 'CLAUSE':
            realisedElement = ClauseHelper.realise(this, phrase);
            break;

          case 'NOUN_PHRASE':
            realisedElement = NounPhraseHelper.realise(this, phrase);
            break;

          case 'VERB_PHRASE':
            realisedElement = VerbPhraseHelper.realise(this, phrase);
            break;

          case 'PREPOSITIONAL_PHRASE':
          case 'ADJECTIVE_PHRASE':
          case 'ADVERB_PHRASE':
            realisedElement = PhraseHelper.realise(this, phrase);
            break;

            // ANY
          default:
            realisedElement = phrase;
            break;
          }
      }
      
      return realisedElement;
    }
}

export default SyntaxProcessor;