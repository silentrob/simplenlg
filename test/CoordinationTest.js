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

describe('CoordinationTest', () => { 

  it("testModifiedCoordVP", (done) => {

    let getUp = nlg.createVerbPhrase("get up");
    let fallDown = nlg.createVerbPhrase("fall down");
    
    let behindTheCurtain = nlg.createPrepositionPhrase("behind");
    behindTheCurtain.addComplement(nlg.createNounPhrase("the", "curtain"));

    let inTheRoom = nlg.createPrepositionPhrase("in");
    inTheRoom.addComplement(nlg.createNounPhrase("the", "room"));

    let coord = nlg.createCoordinatedPhrase(getUp, fallDown);
    coord.setFeature(Feature.TENSE, Tense.PAST);
    should(realiser.realise(coord).getRealisation()).eql("got up and fell down");

    // add a premodifier
    coord.addPreModifier("slowly");
    should(realiser.realise(coord).getRealisation()).eql("slowly got up and fell down");

    // adda postmodifier
    coord.addPostModifier(behindTheCurtain);
    should(realiser.realise(coord).getRealisation()).eql("slowly got up and fell down behind the curtain");

    // put within the context of a sentence
    let s = nlg.createClause("Jake", coord);
    s.setFeature(Feature.TENSE, Tense.PAST);
    should(realiser.realise(s).getRealisation()).eql("Jake slowly got up and fell down behind the curtain");
    
    // add premod to the sentence
    s.addPreModifier(lexicon.getWord("however", LexicalCategory.ADVERB));
    should(realiser.realise(s).getRealisation()).eql("Jake however slowly got up and fell down behind the curtain");

    // add postmod to the sentence
    s.addPostModifier(inTheRoom);
    should(realiser.realise(s).getRealisation()).eql("Jake however slowly got up and fell down behind the curtain in the room");

    done();
  });


  /**
   * Test due to Chris Howell -- create a complex sentence with front modifier
   * and coordinateVP. This is a version in which we create the coordinate
   * phrase directly.
   */
  it.skip("testCoordinateVPComplexSubject", (done) => {
    // "As a result of the procedure the patient had an adverse contrast media reaction and went into cardiogenic shock."
    let s = nlg.createClause();

    s.setSubject(nlg.createNounPhrase("the", "patient"));

    // first VP
    let vp1 = nlg.createVerbPhrase(lexicon.getWord("have", LexicalCategory.VERB));
    let np1 = nlg.createNounPhrase("a", lexicon.getWord("contrast media reaction", LexicalCategory.NOUN));
    np1.addPreModifier(lexicon.getWord("adverse", LexicalCategory.ADJECTIVE));
    vp1.addComplement(np1);

    // second VP
    let vp2 = nlg.createVerbPhrase(lexicon.getWord("go", LexicalCategory.VERB));
    let pp = nlg.createPrepositionPhrase("into", lexicon.getWord("cardiogenic shock", LexicalCategory.NOUN));
    vp2.addComplement(pp);

    // coordinate
    let coord = nlg.createCoordinatedPhrase(vp1, vp2);
    coord.setFeature(Feature.TENSE, Tense.PAST);
    should(realiser.realise(s).getRealisation()).eql("had an adverse contrast media reaction and went into cardiogenic shock");

    // now put this in the sentence
    s.setVerbPhrase(coord);
    s.addFrontModifier("As a result of the procedure");
    should(realiser.realise(s).getRealisation()).eql("As a result of the procedure the patient had an adverse contrast media reaction and went into cardiogenic shock");

    done();
  });

  /**
   * Test setting a conjunction to null
   */
  it("testNullConjunction", (done) => {
    let p = nlg.createClause("I", "be", "happy");
    let q = nlg.createClause("I", "eat", "fish");
    let pq = nlg.createCoordinatedPhrase();
    pq.addCoordinate(p);
    pq.addCoordinate(q);
    pq.setFeature(Feature.CONJUNCTION, "");

    // should come out without conjunction

    should(realiser.realise(pq).getRealisation()).eql("I am happy I eat fish");
    // should come out without conjunction
    pq.setFeature(Feature.CONJUNCTION, null);
    should(realiser.realise(pq).getRealisation()).eql("I am happy I eat fish");
    done();
  });

  /**
   * Check that the negation feature on a child of a coordinate phrase remains
   * as set, unless explicitly set otherwise at the parent level.
   */
  it("testNegationFeature", (done) => {
    let s1 = nlg.createClause("he", "have", "asthma");
    let s2 = nlg.createClause("he", "have", "diabetes");
    s1.setFeature(Feature.NEGATED, true);
    let coord = nlg.createCoordinatedPhrase(s1, s2);
    should(realiser.realise(coord).getRealisation()).eql("he does not have asthma and he has diabetes");

    done();
  });

});

