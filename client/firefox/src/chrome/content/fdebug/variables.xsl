<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0"
   xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul">
   
   <xsl:template match="vargroup">
      
      <treeitem container="true">
         <xsl:choose>
            <xsl:when test="@name='SERVER' or @name='BROWSER'">
               <xsl:attribute name="open">false</xsl:attribute>
            </xsl:when>
            <xsl:otherwise>
               <xsl:attribute name="open">true</xsl:attribute>
            </xsl:otherwise>
         </xsl:choose>
         <treerow>
            <treecell label="{@name}"/>
            <treecell label="{@type}"/>
         </treerow>
         
         <treechildren>
            
            <xsl:apply-templates/>
            
         </treechildren>
         
      </treeitem>
      
   </xsl:template>
   
   <xsl:template match="var">
      
      <treeitem>
         <treerow>
            <treecell label="{@key}"/>
            <treecell label="&#187;{.}&#171;"/>
         </treerow>
         
      </treeitem>
      
   </xsl:template>
   
   <xsl:template match="/">
      
      <xsl:choose>
         <xsl:when test="count(/vardump)=0">
            <vbox flex="1" align="center">
               <spacer flex="1"/>
               <label value="No variable information available" disabled="true"/>
               <spacer flex="1"/>
            </vbox>
         </xsl:when>
         <xsl:otherwise>
            
            <tree flex="1">
               <treecols>
                  <treecol id="varname" label="Variable" primary="true" flex="3" persist="width"/>
                  <splitter class="tree-splitter"/>
                  <treecol id="varvalue" label="Value " flex="7" persist="width"/>
               </treecols>
               
               <treechildren>
                  <xsl:apply-templates select="/vardump/vargroup"/>
               </treechildren>
            </tree>
            
         </xsl:otherwise>
      </xsl:choose>
   </xsl:template>
   
</xsl:stylesheet>
