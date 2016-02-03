<?php
/**
 * Webiny Platform (http://www.webiny.com/)
 *
 * @copyright Copyright (c) 2009-2014 Webiny LTD. (http://www.webiny.com/)
 * @license   http://www.webiny.com/platform/license
 */

namespace Apps\Core\Php\Dispatchers\Flows;

use Apps\Core\Php\DevTools\Entity\EntityAbstract;
use Apps\Core\Php\Dispatchers\AbstractFlow;
use Apps\Core\Php\RequestHandlers\ApiException;
use Webiny\Component\StdLib\Exception\ExceptionAbstract;

/**
 * Class ExecuteStaticMethodFlow
 * @package Apps\Core\Php\Dispatchers
 */
class ExecuteStaticMethodFlow extends AbstractFlow
{

    public function handle(EntityAbstract $entity, $params)
    {
        $method = $this->toCamelCase($params[0]);

        if(!$this->wLogin()->canExecute($entity, $method)){
            throw new ApiException('You don\'t have an EXECUTE permission on ' . get_class($entity));
        }


        $params = $this->injectParams($entity, $method, array_slice($params, 1));

        if ($this->wRequest()->isPost()) {
            $params[] = $this->wRequest()->getRequestData();
        }

        try {
            return $entity::$method(...$params);
        } catch (ExceptionAbstract $e) {
            throw new ApiException($e->getMessage(), $e->getMessage(), 'WBY-ED-EXECUTE_STATIC_METHOD_FLOW', 400);
        }
    }

    public function canHandle($httpMethod, $params)
    {
        return in_array($httpMethod, ['GET', 'POST']) && count($params) >= 1 && !$this->isValidMongoId($params[0]);
    }
}