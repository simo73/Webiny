<?php
namespace Apps\Core\Php\PackageManager\Parser;

use Apps\Core\Php\DevTools\Entity\AbstractEntity;
use Apps\Core\Php\DevTools\Exceptions\AppException;
use Webiny\Component\Entity\Attribute\AbstractAttribute;
use Webiny\Component\Entity\Attribute\AttributeType;
use Webiny\Component\Entity\Attribute\Many2OneAttribute;
use Webiny\Component\Entity\Attribute\One2ManyAttribute;
use Webiny\Component\StdLib\StdObject\StdObjectException;

class EntityParser extends AbstractParser
{
    protected $baseClass = 'Apps\Core\Php\DevTools\Entity\AbstractEntity';
    private $apiMethods;
    private $defaultValues;
    private $headerAuthorizationToken;
    private $attributeDescription;

    function __construct($class)
    {
        parent::__construct($class);
        $this->url = '/entities/' . $this->getAppSlug() . '/' . $this->slug;
        $this->defaultValues = [
            'object'   => new \stdClass(),
            'array'    => '',
            'date'     => $this->datetime()->format('Y-m-d'),
            'datetime' => $this->datetime()->format('Y-m-d H:i:s'),
            'id'       => (string)$this->mongo()->id(),
            'boolean'  => true,
            'string'   => ''
        ];

        $this->headerAuthorizationToken = [
            'name'        => 'X-Webiny-Authorization',
            'description' => 'Authorization token',
            'type'        => 'string',
            'required'    => true
        ];

        $this->headerApiToken = [
            'name'        => 'X-Webiny-Api-Token',
            'description' => 'API token',
            'type'        => 'string',
            'required'    => true
        ];
    }

    public function getAttributes()
    {
        /* @var $attr AbstractAttribute */
        $entity = new $this->class;
        $attributes = [];
        foreach ($entity->getAttributes() as $attrName => $attr) {
            $attrData = [
                'name'         => $attrName,
                'type'         => self::str(get_class($attr))->explode('\\')->last()->replace('Attribute', '')->caseLower()->val(),
                //'validators'         => join(',', $attr->getValidators()), // TODO: need to detect closure validators
                //'validationMessages' => $attr->getValidationMessages(),
                'defaultValue' => $attr->getDefaultValue()
            ];

            foreach ($this->getAttributeDescriptions()[1] as $descIndex => $descAttr) {
                if ($descAttr == $attrName) {
                    $attrData['description'] = trim($this->attributeDescription[2][$descIndex]);
                }
            }

            if ($attr instanceof Many2OneAttribute || $attr instanceof One2ManyAttribute) {
                $attrData['entity'] = $attr->getEntity();
            }

            $attributes[] = $attrData;
        }

        return $attributes;
    }

    public function getRelations()
    {
        $attributeType = function (AbstractAttribute $attr) {
            if ($attr instanceof Many2OneAttribute) {
                return 'many2one';
            }

            if ($attr instanceof One2ManyAttribute) {
                return 'one2many';
            }

            return self::str(get_class($attr))->explode('\\')->last()->replace('Attribute', '')->caseLower()->val();
        };

        /* @var $attr AbstractAttribute */
        $entity = new $this->class;
        $relations = [];
        foreach ($entity->getAttributes() as $attrName => $attr) {
            if ($attr instanceof Many2OneAttribute || $attr instanceof One2ManyAttribute) {
                $relations[] = [
                    'attribute' => $attrName,
                    'class'     => $attr->getEntity(),
                    'type'      => $attributeType($attr)
                ];
            }
        }

        return $relations;
    }

    public function getApiMethods($includeCrudMethods = true)
    {
        if (!$this->apiMethods) {
            $this->apiMethods = $this->getMethods($includeCrudMethods);
        }

        return $this->apiMethods;
    }

    /**
     * Recursively parse entity classes to find all methods exposed to API
     *
     * @param bool $includeCrudMethods
     *
     * @return array
     * @throws AppException
     */
    private function getMethods($includeCrudMethods)
    {
        $crudPatterns = [
            '/.get',
            '{id}.get',
            '/.post',
            '{id}.patch',
            '{id}.delete'
        ];
        $apiDocs = $this->parseApi($this->class);
        $methods = [];
        foreach ($apiDocs as $name => $httpMethods) {
            foreach ($httpMethods as $httpMethod => $config) {
                $key = $name . '.' . $httpMethod;
                if (!$includeCrudMethods && in_array($key, $crudPatterns)) {
                    continue;
                }
                $config = $this->arr($config);
                $definition = [
                    'key'         => $key,
                    'path'        => $this->url . '/' . ltrim($name, '/'),
                    'url'         => $this->wConfig()->get('Application.ApiPath') . $this->url . '/' . ltrim($name, '/'),
                    'name'        => $config->key('name'),
                    'description' => $config->key('description', '', true),
                    'method'      => strtoupper($httpMethod),
                    'headers'     => [
                        'X-Webiny-Authorization' => $this->headerAuthorizationToken,
                        'X-Webiny-Api-Token'     => $this->headerApiToken
                    ]
                ];

                if (count($config['query']) > 0) {
                    $queryParams = http_build_query($config['query']);
                    $definition['path'] .= '?' . $queryParams;
                    $definition['url'] .= '?' . $queryParams;
                }

                // Build path, body and header parameters
                foreach ($config->key('path', [], true) as $pName => $pConfig) {
                    $definition['parameters'][$pName] = [
                        'name'        => $pName,
                        'in'          => 'path',
                        'description' => $pConfig['description'],
                        'type'        => $pConfig['type']
                    ];
                }

                foreach ($config->key('body', [], true) as $pName => $pConfig) {
                    $definition['body'][$pName] = [
                        'type'  => $pConfig['type'],
                        'value' => $pConfig['value'] ?? null
                    ];
                }
                foreach ($config->key('headers', [], true) as $pName => $pConfig) {
                    $definition['headers'][$pName] = [
                        'name'        => $pName,
                        'description' => $pConfig['description'],
                        'type'        => $pConfig['type'],
                        'required'    => true
                    ];
                }

                $methods[] = $definition;
            }
        }

        return $methods;
    }

    private function getAttributeDescriptions()
    {
        if ($this->attributeDescription) {
            return $this->attributeDescription;
        }

        // Extract attribute descriptions from @property annotation
        $reflection = new \ReflectionClass($this->class);
        $comments = $reflection->getDocComment();
        $this->attributeDescription = [];
        preg_match_all('#@property[a-zA-Z\s]+\$([a-zA-Z]+)(.*)?#m', $comments, $this->attributeDescription);

        return $this->attributeDescription;
    }
}