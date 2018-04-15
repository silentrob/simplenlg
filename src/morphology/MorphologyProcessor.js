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


import NLGmodule from "../framework/nlgmodule";
import CoordinatedPhraseElement from '../framework/coordinatedPhraseElement';
import InflectedWordElement from '../framework/inflectedWordElement';
import StringElement from '../framework/stringElement';
import WordElement from '../framework/wordElement';
import ListElement from '../framework/listElement';
import DocumentElement from '../framework/documentElement';
import MorphologyRules from './morphologyRules';

import LexicalCategory from '../features/LexicalCategory';

class MorphologyProcessor extends NLGmodule {
  constructor(){
    super();
  }


  realise(element){

    if (element instanceof Array){
      return this.realiseList(element);
    }

    let realisedElement = element;
    if (element instanceof InflectedWordElement) {
      realisedElement = this.doMorphology(realisedElement);
    } else if (element instanceof StringElement) {
      realisedElement = element;
    } else if (element instanceof WordElement) {
      let defaultSpell = element.getDefaultSpellingVariant();
      if (defaultSpell != null) {
        realisedElement = new StringElement(defaultSpell);
      }
    } else if (element instanceof DocumentElement) {
      let children = element.getChildren();
      element.setComponents(this.realise(children));
      realisedElement = element;

    } else if (element instanceof ListElement) {
      realisedElement = new ListElement();
      realisedElement.addComponents(this.realise(element.getChildren()));
    } else if (element instanceof CoordinatedPhraseElement) {
      let children = element.getChildren();
      element.clearCoordinates();

      if (children != null && children.length > 0) {
        element.addCoordinate(this.realise(children[0]));

        for (let index = 1; index < children.length; index++) {
          element.addCoordinate(this.realise(children[index]));
        }

        realisedElement = element;
      }

    }
    else if (element != null) {
      realisedElement = element;
    }

    return realisedElement;
  }

  doMorphology(element){
    let realisedElement = null;

    if (element.getFeatureAsBoolean('NON_MORPH')){
      realisedElement = new StringElement(element.getBaseForm());
      realisedElement.setFeature('DISCOURSE_FUNCTION', element.getFeature('DISCOURSE_FUNCTION'));
    } else {
      let baseWord = element.getFeatureAsElement('BASE_WORD');
      if (baseWord == null && this.lexicon != null) {
        baseWord = this.lexicon.lookupWord(element.getBaseForm());
      }
      
      let category = element.getCategory();
      if (category instanceof LexicalCategory){
        category = category.name;
      }
      switch (category) {
        case 'PRONOUN':
          realisedElement = MorphologyRules.doPronounMorphology(element);
          break;

        case 'NOUN':
          realisedElement = MorphologyRules.doNounMorphology(element, baseWord);
          break;

        case 'VERB':
          realisedElement = MorphologyRules.doVerbMorphology(element, baseWord);
          break;

        case 'ADJECTIVE':
          realisedElement = MorphologyRules.doAdjectiveMorphology(element, baseWord);
          break;

        case 'ADVERB':
          realisedElement = MorphologyRules.doAdverbMorphology(element, baseWord);
          break;

        default:
          realisedElement = new StringElement(element.getBaseForm());
          realisedElement.setFeature('DISCOURSE_FUNCTION',element.getFeature('DISCOURSE_FUNCTION'));
        }
      
    }
    return realisedElement;
  }

  realiseList(elements) {
    let realisedElements = [];
    let currentElement = null;
    let determiner = null;
    let prevElement = null;

    if (elements != null) {
      for (let i = 0; i < elements.length; i++){
        let eachElement = elements[i];
        currentElement = this.realise(eachElement);

        if (currentElement != null) {
          //pass the discourse function and appositive features -- important for orth processor
          currentElement.setFeature('APPOSITIVE', eachElement.getFeature('APPOSITIVE'));
          let func = eachElement.getFeature('DISCOURSE_FUNCTION');
                    
          if(func != null) {
            currentElement.setFeature('DISCOURSE_FUNCTION', func);
          }
                            
          if(prevElement != null && prevElement instanceof StringElement && eachElement instanceof InflectedWordElement && eachElement.getCategory() == 'NOUN'){
            let prevString = prevElement.getRealisation();
            console.log("realiseList - This Wont work yet");
            prevElement.setRealisation(DeterminerAgrHelper.checkEndsWithIndefiniteArticle(prevString, currentElement.getRealisation())); 
          }
          
          realisedElements.push(currentElement);

          if (determiner == null && currentElement.getFeature('DISCOURSE_FUNCTION') == 'SPECIFIER'){

            determiner = currentElement;
            determiner.setFeature('NUMBER', eachElement.getFeature('NUMBER'));

          } else if (determiner != null) {

            if (currentElement instanceof ListElement) {
              // list elements: ensure det matches first element
              let firstChild = currentElement.getChildren()[0];

              if (firstChild != null) {
                //AG: need to check if child is a coordinate
                if (firstChild instanceof CoordinatedPhraseElement) {
                  MorphologyRules.doDeterminerMorphology(determiner, firstChild.getChildren()[0].getRealisation());
                } else {
                  MorphologyRules.doDeterminerMorphology(determiner, firstChild.getRealisation());
                }
              }

            } else {
              // everything else: ensure det matches realisation
              MorphologyRules.doDeterminerMorphology(determiner, currentElement.getRealisation());
            }

            determiner = null;
          }
        }
        prevElement = eachElement;
      }
    }

    return realisedElements;
  }
}

export default MorphologyProcessor;