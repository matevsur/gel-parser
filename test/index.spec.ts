import * as assert from 'power-assert';
import { Parser } from '../src/index';
import { or, time } from '../src/logicalRule';

describe('GEL Parser', () => {
    context('Calculator parser test.', () => {
        const rules = {
            $begin: 'expr',
            expr: or(
                [{ left: 'int' }, /[\+]/, { right: 'expr' }],
                { atom: 'int' }),
            int: /[0-9]+/
        };
        const actions = {
            expr: $ => {
                if ($.left) {
                    return $.left + $.right;
                } else {
                    return $.atom;
                }
            },
            int: $ => parseInt($)
        };

        const parser = new Parser(rules, actions);
        const result = parser.run('1 + 2 + 3 + 2000 + 100');

        it('The calculation result is correct.', () => {
            assert.equal(result, 2106);
        });
    });

    context('Logical rules test.', () => {
        const rules = {
            $begin: or(
                { a: 'int' },
                { b: 'alphabet' }),
            int: /[0-9]+/,
            alphabet: /[a-zA-Z]+/
        };

        const parser = new Parser(rules, {});

        it('Match only one rule.', () => {
            const result = parser.run('100');
            assert.equal(result.a, '100');
            assert.strictEqual(result.b, undefined);

            const result2 = parser.run('abc');
            assert.strictEqual(result2.a, undefined);
            assert.equal(result2.b, 'abc');
        });
    });

    context('Action test.', () => {
        const rules = {
            $begin: /[0-9]+/
        };

        let isExecutedAction = false;
        const actions = {
            $begin: ($: any) => {
                isExecutedAction = true;
                it('Check the expected value of the match result.', () => {
                    assert.strictEqual($, '100');
                });
                return parseInt($);
            }
        };

        const intParser = new Parser(rules, actions);
        const result = intParser.run('100');

        it('Check whether the action was executed.', () => {
            assert.ok(isExecutedAction);
        });
    });

    context('$space test.', () => {
        const rules = {
            $begin: /[0-9]+/
        };
        const actions = {
            $space: ($: any) => {
                it('Check whether the space could was parsed.', () => {
                    assert.strictEqual($, ' \t\r\n');
                });
                return $;
            }
        };

        const result = new Parser(rules, actions).run(' \t\r\n123');

        it('$space is working.', () => {
            assert.strictEqual(result, '123');
        });

        it('rules are not destroyed.', () => {
            assert.strictEqual((rules as any).$space, undefined);
        });
    });

    context('Logging test.', () => {
        const parser = new Parser({ $begin: /./ }, {});

        let buffer = '';
        function log(message: string) {
            buffer += message;
        }

        it('Supressed log.', () => {
            buffer = '';
            parser.run('test', {
                verbose: false,
                logFunc: log
            });
            assert.ok(buffer === '');
        });

        it('Output log.', () => {
            buffer = '';
            parser.run('test', {
                verbose: true,
                logFunc: log
            });
            assert.ok(buffer !== '');
        });
    });

    context('Tagged rule test.', () => {
        const rules = {
            $begin: { a: /hello/ }
        };

        const actions = {
            $begin: $ => {
                it('Match results can be obtained by tag specification.', () => {
                    assert.equal($.a, 'hello');
                    return $;
                });
            }
        };

        new Parser(rules, actions).run('hello');
    });

    context('Nest tagged rule test.', () => {
        const rules = {
            $begin: { a: { b: { c: /100/ } } }
        };

        const parser = new Parser(rules, {});
        const result = parser.run('100');

        it('Match results can be obtained even with nested tags.', () => {
            assert.equal(result.a.b.c, '100');
        });
    });

    context('Time rule.', () => {
        const rules = {
            $begin: or('just', 'greater', 'lesser', 'range', 'tagged'),
            just: time(/a/, 5),
            greater: time(/b/, {start: 2}),
            lesser: time(/c/, {end: 8}),
            range: time(/d/, {start: 3, end: 5}),
            tagged: time({a: /e/}, 2)
        };

        const parser = new Parser(rules, {});
        
        it('just', () => {
            assert.notEqual( parser.run('aaaaa'), null );
            assert.equal( parser.run('aaaa'), null );
            assert.equal( parser.run('aaaaaa'), null );
        });

        it('greater', () => {
            
        });

        it('lesser', () => {
            
        });

        it('range', () => {
            
        });

        it('tagged', () => {
            
        });
    });
});
