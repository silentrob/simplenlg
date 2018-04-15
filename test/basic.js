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


import Ortho from '../src/ortho/orthography';
import StringElement from '../src/framework/stringElement';
import Element from '../src/framework/element';

import mocha from 'mocha';
import should from 'should/as-function';

describe('Ortho interface', () => { 

  let ortho = new Ortho();

  it("terminateSentence", (done) => {
    should(ortho.terminateSentence("test")).eql("test.");
    should(ortho.terminateSentence("test", true)).eql("test?");
    should(ortho.terminateSentence("test?")).eql("test?");
    should(ortho.terminateSentence("test.")).eql("test.");
    done();    
  });

  it("capitaliseFirstLetter", (done) => {
    should(ortho.capitaliseFirstLetter("test")).eql("Test");
    should(ortho.capitaliseFirstLetter("123 test")).eql("123 test");
    done();    
  });

  it("stripLeadingCommas", (done) => {
    should(ortho.stripLeadingCommas(", test")).eql("test");
    should(ortho.stripLeadingCommas(" , test")).eql("test");
    done();    
  });

  it("realiseSentence", (done) => {
    let elements = [];
    elements.push(new StringElement("this"));
    elements.push(new StringElement("is"));
    elements.push(new StringElement("a"));
    elements.push(new StringElement("test"));
    let final = new Element();

    ortho.realiseSentence(elements, final);
    should(final.getRealisation()).eql("This is a test.");
    done();    
  });
});
