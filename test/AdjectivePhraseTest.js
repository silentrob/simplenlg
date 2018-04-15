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


import Lexicon from '../src/lexicon/lexicon';
import NPPhraseSpec from '../src/phraseSpec/NPPhraseSpec';
import Realiser from '../src/realiser/Realiser';

import StringElement from '../src/framework/stringElement';
import WordElement from '../src/framework/wordElement';
import InflectedWordElement from '../src/framework/inflectedWordElement';
import PhraseElement from '../src/framework/phraseElement';
import CoordinatedPhraseElement from '../src/framework/coordinatedPhraseElement';
import NLG from '../src/framework/nlg';

import NumberAgreement from '../src/features/NumberAgreement';
import Feature from '../src/features/Feature';
import Gender from '../src/features/Gender';
import LexicalFeature from '../src/features/LexicalFeature';
import Person from '../src/features/Person';
import InternalFeature from '../src/features/InternalFeature';
import Tense from '../src/features/Tense';

import LexicalCategory from '../src/features/LexicalCategory';

import mocha from 'mocha';
import should from 'should/as-function';

const lexicon = new Lexicon('small-lexicon.xml');
const nlg = new NLG(lexicon);
const realiser = new Realiser(lexicon);


describe('AdjectivePhraseTest', () => { 

  it("testAdj", (done) => {

    let salacious = nlg.createAdjectivePhrase("salacious");
    let beautiful = nlg.createAdjectivePhrase("beautiful");
    let stunning = nlg.createAdjectivePhrase("stunning");

    // form the adjphrase "incredibly salacious"
    salacious.addPreModifier(nlg.createAdverbPhrase("incredibly")); 
    should(realiser.realise(salacious).getRealisation()).eql("incredibly salacious");

    // form the adjphrase "incredibly beautiful"
    beautiful.addPreModifier("amazingly"); 
    should(realiser.realise(beautiful).getRealisation()).eql("amazingly beautiful");


    // coordinate the two aps
    let coordap = new CoordinatedPhraseElement(salacious, beautiful);
    should(realiser.realise(coordap).getRealisation()).eql("incredibly salacious and amazingly beautiful");
    
    done();
  });


  it("testAdj2", (done) => {

    let sent = nlg.createClause("John", "eat"); 
    let adv = nlg.createAdverbPhrase("quickly");
    sent.addPreModifier(adv);
    should(realiser.realise(sent).getRealisation()).eql("John quickly eats");

    adv.addPreModifier("very");
    should(realiser.realise(sent).getRealisation()).eql("John very quickly eats");

    done();
  });

  it("testParticipleAdj", (done) => {
    let ap = nlg.createAdjectivePhrase(lexicon.getWord("associated", LexicalCategory.ADJECTIVE));
    should(realiser.realise(ap).getRealisation()).eql("associated");
    done();
  });

  it("testMultipleModifiers", (done) => {
    let np = nlg.createNounPhrase(lexicon.getWord("message", LexicalCategory.NOUN));
    np.addPreModifier(lexicon.getWord("active", LexicalCategory.ADJECTIVE));
    np.addPreModifier(lexicon.getWord("temperature", LexicalCategory.ADJECTIVE));
    should(realiser.realise(np).getRealisation()).eql("active, temperature message");
    
    //now we set the realiser not to separate using commas
    realiser.setCommaSepPremodifiers(false);
    should(realiser.realise(np).getRealisation()).eql("active temperature message");

    done();
  });

});



